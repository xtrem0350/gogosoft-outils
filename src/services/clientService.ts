/** Services de gestion des clients par boutique. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";

export interface ClientRecord {
  id: string;
  shop_id: string;
  full_name: string;
  whatsapp: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  total_repairs?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateClientData {
  shop_id: string;
  full_name: string;
  whatsapp: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

/** Récupère les clients d'une boutique. */
export async function getClientsByShop(shopId: string): Promise<ClientRecord[]> {
  const hasSession = await hasActiveSession();
  console.log("[clientService] called", { hasSession, shopId });
  if (!hasSession || !shopId) return [];
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("shop_id", requireShopId(shopId))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ClientRecord[];
  } catch (error) {
    console.error("[clientService] Catch:", error);
    return [];
  }
}

/** Récupère un client par son identifiant. */
export async function getClientById(id: string): Promise<ClientRecord | null> {
  if (!(await hasActiveSession())) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ClientRecord | null) ?? null;
}

/** Crée un client pour une boutique. */
export async function createClient(data: CreateClientData): Promise<ClientRecord> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const shopId = requireShopId(data.shop_id);
  console.log("[clientService] called", { hasSession: true, shopId });
  const { data: client, error } = await supabase
    .from("clients")
    .insert({ ...data, shop_id: shopId })
    .select()
    .single();
  if (error) throw error;
  return client as ClientRecord;
}

/** Met à jour un client. */
export async function updateClient(
  id: string,
  data: Partial<CreateClientData>,
): Promise<ClientRecord> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: client, error } = await supabase
    .from("clients")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return client as ClientRecord;
}

/** Supprime un client. */
export async function deleteClient(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

/** Recherche un client dans une boutique. */
export async function searchClients(shopId: string, query: string): Promise<ClientRecord[]> {
  const hasSession = await hasActiveSession();
  console.log("[clientService] called", { hasSession, shopId });
  if (!hasSession || !shopId) return [];
  requireShopId(shopId);
  const q = query.trim();
  if (!q) {
    return getClientsByShop(shopId);
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("shop_id", shopId)
    .or(`full_name.ilike.%${q}%,whatsapp.ilike.%${q}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientRecord[];
}
