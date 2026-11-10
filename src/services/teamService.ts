import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import type { EmployeeRole } from "@/services/invitationsService";

export interface TeamMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: string;
  created_at?: string | null;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
}

interface TeamProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  avatar_url?: string | null;
}

function profileText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getTeamMembers(shopId: string): Promise<TeamMember[]> {
  if (!(await hasActiveSession()) || !shopId) return [];
  const { data, error } = await (supabase.from("shop_members" as any) as any)
    .select("id, shop_id, user_id, role, avatar_url, created_at")
    .eq("shop_id", requireShopId(shopId))
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const userIds = [...new Set(rows.map((row) => String(row["user_id"] ?? "")).filter(Boolean))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map(
    ((profiles ?? []) as TeamProfile[]).map((profile) => [profile.id, profile]),
  );
  return rows.map((row) => {
    const userId = String(row["user_id"] ?? "");
    const profile = profileById.get(userId);
    const fullName = profileText(profile?.full_name) ?? profileText(row["full_name"]);
    const email = profileText(profile?.email) ?? profileText(row["email"]);
    const whatsapp =
      profileText(profile?.whatsapp) ??
      profileText(profile?.phone) ??
      profileText(row["whatsapp"]) ??
      profileText(row["phone"]);
    return {
      id: String(row["id"] ?? userId),
      shop_id: String(row["shop_id"] ?? shopId),
      user_id: userId,
      role: String(row["role"] ?? "technicien"),
      created_at: typeof row["created_at"] === "string" ? row["created_at"] : null,
      avatar_url: profileText(profile?.avatar_url) ?? profileText(row["avatar_url"]),
      full_name: fullName,
      email,
      whatsapp,
    };
  });
}

export async function uploadTeamAvatar(shopId: string, userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    throw new Error("Choisissez une image de 5 Mo maximum.");
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${requireShopId(shopId)}/${userId}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("team-avatars").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const url = supabase.storage.from("team-avatars").getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await (supabase.from("shop_members" as any) as any)
    .update({ avatar_url: url })
    .eq("shop_id", requireShopId(shopId))
    .eq("user_id", userId);
  if (updateError) throw updateError;
  return url;
}

export async function updateMemberRole(
  shopId: string,
  userId: string,
  role: EmployeeRole | "owner",
): Promise<void> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { error } = await (supabase.from("shop_members" as any) as any)
    .update({ role })
    .eq("shop_id", requireShopId(shopId))
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeTeamMember(shopId: string, userId: string): Promise<void> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { error } = await (supabase.from("shop_members" as any) as any)
    .delete()
    .eq("shop_id", requireShopId(shopId))
    .eq("user_id", userId);
  if (error) throw error;
}
