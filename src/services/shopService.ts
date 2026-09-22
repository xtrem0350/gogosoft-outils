/** Services de gestion des boutiques / shops pour l'espace multi-boutique SaaS. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";

export interface Shop {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  owner_id?: string | null;
  created_at?: string | null;
}

export interface CreateShopData {
  name: string;
  address?: string | null;
  phone?: string | null;
}

/** Récupère toutes les boutiques de l'utilisateur courant, propriétaire ou membre. */
export async function getUserShops(): Promise<Shop[]> {
  const hasSession = await hasActiveSession();
  console.log("[shopService] called", { hasSession, shopId: null });
  if (!hasSession) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return [];
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("shop_members")
    .select("shop_id, shops(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (membershipsError) throw membershipsError;

  const memberShops = ((memberships ?? []) as Array<{ shops?: Shop | Shop[] | null }>).flatMap(
    (entry) => {
      const candidate = entry.shops;
      if (!candidate) return [];
      const shops = Array.isArray(candidate) ? candidate : [candidate];
      return shops.map((shop) => ({
        ...shop,
        owner_id: shop.owner_id ?? userId,
      }));
    },
  );

  const { data: ownedShops, error: ownerError } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (ownerError) throw ownerError;

  const merged = [...((ownedShops ?? []) as Shop[]), ...memberShops];
  const unique = merged.filter(
    (shop, index, array) => array.findIndex((entry) => entry.id === shop.id) === index,
  );

  return unique.sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
}

/** Crée une boutique et lui associe le propriétaire. */
export async function createShop(data: CreateShopData): Promise<Shop> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("Utilisateur non authentifié.");
  }

  const { data: shop, error } = await supabase
    .from("shops")
    .insert({ ...data, owner_id: userId })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("shop_members")
    .upsert(
      { shop_id: shop.id, user_id: userId, role: "owner" },
      { onConflict: "shop_id,user_id" },
    );

  return shop as unknown as Shop;
}

/** Récupère une boutique par son identifiant. */
export async function getShopById(id: string): Promise<Shop | null> {
  if (!(await hasActiveSession())) return null;
  requireShopId(id);
  const { data, error } = await supabase.from("shops").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as Shop | null) ?? null;
}

/** Met à jour les informations d'une boutique. */
export async function updateShop(id: string, data: Partial<CreateShopData>): Promise<Shop> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  requireShopId(id);
  const { data: shop, error } = await supabase
    .from("shops")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return shop as unknown as Shop;
}

/** Supprime une boutique. */
export async function deleteShop(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  requireShopId(id);
  const { error } = await supabase.from("shops").delete().eq("id", id);
  if (error) throw error;
}

/** Récupère les membres d'une boutique. */
export async function getShopMembers(shopId: string) {
  if (!(await hasActiveSession())) return [];
  requireShopId(shopId);
  const { data, error } = await supabase.from("shop_members").select("*").eq("shop_id", shopId);
  if (error) throw error;
  return data ?? [];
}

/** Ajoute un membre à une boutique. */
export async function addShopMember(
  shopId: string,
  userId: string,
  role: "owner" | "technicien" = "owner",
) {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  requireShopId(shopId);
  const { data, error } = await supabase
    .from("shop_members")
    .upsert({ shop_id: shopId, user_id: userId, role }, { onConflict: "shop_id,user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}
