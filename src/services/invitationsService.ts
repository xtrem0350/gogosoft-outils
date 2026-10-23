import { supabase } from "@/integrations/supabase/client";

export type InvitationRole = "technicien" | "caissier";

export interface PendingInvitation {
  id: string;
  shop_id: string;
  shop_name?: string;
  full_name: string;
  whatsapp: string;
  role: InvitationRole;
  code: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export async function createInvitation(input: {
  shop_id: string;
  full_name: string;
  whatsapp: string;
  role: InvitationRole;
}): Promise<PendingInvitation> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Connectez-vous pour créer une invitation.");

  const { data, error } = await (supabase.from("pending_invitations" as any) as any)
    .insert({
      shop_id: input.shop_id,
      full_name: input.full_name.trim(),
      whatsapp: input.whatsapp.trim(),
      role: input.role,
      code: generateCode(),
      created_by: authData.user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PendingInvitation;
}

export async function getPendingInvitations(shopId: string): Promise<PendingInvitation[]> {
  const { data, error } = await (supabase.from("pending_invitations" as any) as any)
    .select("*")
    .eq("shop_id", shopId)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingInvitation[];
}

export async function getInvitationByCode(code: string): Promise<PendingInvitation | null> {
  const { data, error } = await supabase.rpc("get_invitation_by_code" as any, {
    p_code: code.toUpperCase().trim(),
  } as any);
  if (error) throw error;
  return (data ?? null) as PendingInvitation | null;
}

export async function acceptInvitation(input: {
  code: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
}): Promise<{ success: boolean; shop_id: string; role: string }> {
  const { data, error } = await supabase.rpc("accept_invitation" as any, {
    p_code: input.code.toUpperCase().trim(),
    p_user_id: input.user_id,
    p_full_name: input.full_name.trim(),
    p_email: input.email.trim(),
    p_whatsapp: input.whatsapp.trim(),
  } as any);
  if (error) throw error;
  return data as { success: boolean; shop_id: string; role: string };
}

export async function cancelInvitation(id: string): Promise<void> {
  const { error } = await (supabase.from("pending_invitations" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
