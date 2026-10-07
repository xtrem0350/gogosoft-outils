/** Services de gestion des clients par boutique. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import { DEMO_SHOP_ID, getDemoClients, isDemoMode, updateDemoSession } from "@/services/demoService";

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
  if (isDemoMode()) return getDemoClients();
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
  if (isDemoMode()) return getDemoClients().find((client) => client.id === id) ?? null;
  if (!(await hasActiveSession())) return null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ClientRecord | null) ?? null;
}

/** Crée un client pour une boutique. */
export async function createClient(data: CreateClientData): Promise<ClientRecord> {
  if (isDemoMode()) {
    const now = new Date().toISOString();
    const client: ClientRecord = {
      id: `demo-client-${crypto.randomUUID()}`,
      shop_id: DEMO_SHOP_ID,
      full_name: data.full_name,
      whatsapp: data.whatsapp,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      total_repairs: 0,
      created_at: now,
      updated_at: now,
    };
    updateDemoSession((session) => ({ ...session, clients: [client, ...session.clients] }));
    return client;
  }
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

/** Stocke une photo client sous un chemin déterministe pour la retrouver sans colonne dédiée. */
export async function uploadClientPhoto(client: ClientRecord, file: File): Promise<void> {
  if (isDemoMode()) throw new Error("L'envoi de photo n'est pas disponible en mode démo.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const path = `${requireShopId(client.shop_id)}/${client.id}/photo`;
  const { error } = await supabase.storage.from("clients").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
}

/** Génère une URL signée pour la photo client si elle existe. */
export async function getClientPhotoUrl(client: ClientRecord): Promise<string | null> {
  if (isDemoMode()) return null;
  if (!(await hasActiveSession())) return null;
  const path = `${client.shop_id}/${client.id}/photo`;
  const { data, error } = await supabase.storage.from("clients").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Met à jour un client. */
export async function updateClient(
  id: string,
  data: Partial<CreateClientData>,
): Promise<ClientRecord> {
  if (isDemoMode()) {
    let updated: ClientRecord | undefined;
    updateDemoSession((session) => ({
      ...session,
      clients: session.clients.map((client) => {
        if (client.id !== id) return client;
        updated = { ...client, ...data, updated_at: new Date().toISOString() };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Client introuvable.");
    return updated;
  }
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
  if (isDemoMode()) {
    updateDemoSession((session) => ({
      ...session,
      clients: session.clients.filter((client) => client.id !== id),
    }));
    return;
  }
  if (!(await hasActiveSession())) return;
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

/** Recherche un client dans une boutique. */
export async function searchClients(shopId: string, query: string): Promise<ClientRecord[]> {
  if (isDemoMode()) {
    const normalized = query.trim().toLocaleLowerCase();
    return getDemoClients().filter(
      (client) =>
        !normalized ||
        client.full_name.toLocaleLowerCase().includes(normalized) ||
        client.whatsapp.toLocaleLowerCase().includes(normalized),
    );
  }
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
