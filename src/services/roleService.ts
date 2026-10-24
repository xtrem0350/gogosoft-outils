import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";

const VALID_ROLES = new Set([
  "owner",
  "technicien",
  "caissier",
  "magasinier",
  "receptionniste",
  "vendeur",
  "super_admin",
]);

function normalizeRole(value: string | null | undefined): string | null {
  if (!value) return null;
  const role = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    manager: "owner",
    admin: "owner",
    technicien_pc: "technicien",
    superadmin: "super_admin",
    super_admin: "super_admin",
  };
  const normalized = aliases[role] ?? role;
  return VALID_ROLES.has(normalized) ? normalized : null;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function getUserShopRoles(shopId: string): Promise<string[]> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase.rpc("get_user_shop_roles", {
      p_shop_id: validShopId,
    });
    if (!error && Array.isArray(data)) {
      return [...new Set((data as Array<string | null | undefined>).map(normalizeRole).filter(Boolean) as string[])];
    }
  } catch {
    // Fallback SQL below when the function is not yet present.
  }

  try {
    const { data, error } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", validShopId)
      .eq("user_id", userId);
    if (error) throw error;
    return [...new Set((data ?? []).map((row) => normalizeRole((row as { role?: string }).role)).filter(Boolean) as string[])];
  } catch {
    return [];
  }
}

export async function enableRoleForUser(shopId: string, userId: string, role: string): Promise<void> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const normalized = normalizeRole(role);
  if (!normalized) throw new Error(`Rôle inconnu : ${role}`);

  const { error } = await supabase
    .from("shop_members")
    .upsert({ shop_id: validShopId, user_id: userId, role: normalized }, { onConflict: "shop_id,user_id" });

  if (error) throw error;
}

export async function disableRoleForUser(shopId: string, userId: string, role: string): Promise<void> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const normalized = normalizeRole(role);
  if (!normalized) return;

  const { error } = await supabase
    .from("shop_members")
    .delete()
    .eq("shop_id", validShopId)
    .eq("user_id", userId)
    .eq("role", normalized);

  if (error) throw error;
}

export async function getAllRolesForShop(shopId: string): Promise<Array<{ user_id: string; roles: string[] }>> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  try {
    const { data, error } = await supabase
      .from("shop_members")
      .select("user_id, role")
      .eq("shop_id", validShopId);
    if (error) throw error;

    const map = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const userId = (row as { user_id?: string }).user_id;
      const role = normalizeRole((row as { role?: string }).role);
      if (!userId || !role) continue;
      const set = map.get(userId) ?? new Set<string>();
      set.add(role);
      map.set(userId, set);
    }

    return [...map.entries()].map(([user_id, roles]) => ({ user_id, roles: [...roles] }));
  } catch {
    return [];
  }
}

export async function getUserRolesInShop(shopId: string, userId: string): Promise<string[]> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  try {
    const { data, error } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", validShopId)
      .eq("user_id", userId);
    if (error) throw error;

    return [...new Set((data ?? []).map((row) => normalizeRole((row as { role?: string }).role)).filter(Boolean) as string[])];
  } catch {
    return [];
  }
}
