import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  shop_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatConversation {
  shop_id: string;
  shop_name: string;
  owner_id: string;
  latest_message: string;
  latest_at: string;
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Vous devez être connecté pour accéder au support.");
  return data.user.id;
}

export async function getChatUserId(): Promise<string> {
  return getCurrentUserId();
}

export async function getSupportRecipientId(): Promise<string> {
  const { data, error } = await supabase.rpc("get_chat_support_recipient");
  if (error) throw error;
  if (typeof data !== "string") {
    throw new Error("Aucun SuperAdmin n'est disponible pour le support.");
  }
  return data;
}

export async function sendMessage(
  from: string,
  to: string,
  shopId: string,
  message: string,
): Promise<ChatMessage> {
  const body = message.trim();
  if (!from || !to || !shopId) throw new Error("Les participants et la boutique sont obligatoires.");
  if (!body) throw new Error("Le message ne peut pas être vide.");
  if (body.length > 10_000) throw new Error("Le message dépasse la longueur maximale de 10 000 caractères.");
  const currentUserId = await getCurrentUserId();
  if (currentUserId !== from) throw new Error("L'expéditeur ne correspond pas à la session active.");

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_id: currentUserId,
      receiver_id: to,
      shop_id: shopId,
      message: body,
    })
    .select("id, sender_id, receiver_id, shop_id, message, read_at, created_at")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function getMessages(shopId: string, since?: string): Promise<ChatMessage[]> {
  if (!shopId) throw new Error("La boutique est obligatoire pour charger la conversation.");
  if (since && !Number.isFinite(Date.parse(since))) {
    throw new Error("La date de début des messages est invalide.");
  }
  let query = supabase
    .from("chat_messages")
    .select("id, sender_id, receiver_id, shop_id, message, read_at, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: true });
  if (since) query = query.gte("created_at", since);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function markAsRead(messageId: string): Promise<void> {
  if (!messageId) throw new Error("Le message à marquer comme lu est obligatoire.");
  const currentUserId = await getCurrentUserId();
  const { error } = await supabase
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("receiver_id", currentUserId)
    .is("read_at", null);
  if (error) throw error;
}

export async function getChatConversations(): Promise<ChatConversation[]> {
  const currentUserId = await getCurrentUserId();
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("id, sender_id, receiver_id, shop_id, message, created_at")
    .not("shop_id", "is", null)
    .order("created_at", { ascending: false });
  if (messagesError) throw messagesError;

  const latestByShop = new Map<string, (typeof messages)[number]>();
  for (const message of messages ?? []) {
    if (message.shop_id && !latestByShop.has(message.shop_id)) {
      latestByShop.set(message.shop_id, message);
    }
  }
  const shopIds = [...latestByShop.keys()];
  if (shopIds.length === 0) return [];

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("id, name")
    .in("id", shopIds);
  if (shopsError) throw shopsError;
  const shopNames = new Map((shops ?? []).map((shop) => [shop.id, shop.name]));

  return [...latestByShop.entries()].map(([shopId, message]) => ({
    shop_id: shopId,
    shop_name: shopNames.get(shopId) ?? shopId,
    owner_id: message.sender_id === currentUserId ? message.receiver_id : message.sender_id,
    latest_message: message.message,
    latest_at: message.created_at,
  }));
}

export function subscribeToChat(
  shopId: string | null,
  onMessage: () => void,
): () => void {
  let channel = supabase.channel(`chat_messages:${shopId ?? "all"}`);
  channel = channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "chat_messages",
      ...(shopId ? { filter: `shop_id=eq.${shopId}` } : {}),
    },
    onMessage,
  );
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
