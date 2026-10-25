import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/services/demoService";
import { isSimulationMode } from "@/services/simulationService";

export type EmployeeRole = "technicien" | "caissier" | "magasinier" | "receptionniste" | "vendeur";
export type InvitationRole = EmployeeRole;

export interface PendingInvitation {
  id: string;
  shop_id: string;
  shop_name?: string;
  full_name: string;
  whatsapp: string;
  role: EmployeeRole;
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
  role: EmployeeRole;
}): Promise<PendingInvitation> {
  const shopId = input.shop_id;
  if (isSimulationMode()) {
    throw new Error(
      "Les invitations ne sont pas disponibles dans un atelier simulé. Sélectionnez une boutique réelle pour inviter un employé.",
    );
  }
  if (isDemoMode()) {
    throw new Error(
      "Les invitations ne sont pas disponibles en mode démo. Ouvrez une boutique réelle pour inviter un employé.",
    );
  }
  if (!shopId) {
    throw new Error("Boutique introuvable. Impossible de créer l'invitation.");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shopId)) {
    throw new Error(
      "Identifiant de boutique invalide. Sélectionnez une boutique réelle pour créer l'invitation.",
    );
  }
  if (!input.full_name?.trim()) {
    throw new Error("Le nom est requis.");
  }
  if (!input.whatsapp?.trim()) {
    throw new Error("Le numéro WhatsApp est requis.");
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = userData?.user?.id ?? null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await (supabase.from("pending_invitations" as any) as any)
      .insert({
        shop_id: shopId,
        full_name: input.full_name.trim(),
        whatsapp: input.whatsapp.trim(),
        role: input.role,
        code: generateCode(),
        created_by: userId,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[invitations] createInvitation FULL ERROR:", JSON.stringify(error, null, 2));
      if (error.code === "23505" && attempt < 2) continue;
      throw error;
    }
    if (!data) {
      throw new Error("L'invitation n'a pas pu être créée.");
    }
    return data as PendingInvitation;
  }

  throw new Error("Impossible de générer un code d'invitation unique.");
}

export async function getPendingInvitations(shopId: string): Promise<PendingInvitation[]> {
  if (isSimulationMode()) return [];
  if (isDemoMode()) return [];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shopId)) {
    throw new Error("Identifiant de boutique invalide.");
  }
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
  ncni?: string;
  lieu_habitation?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; shop_id: string; role: string }> {
  const { data, error } = await supabase.rpc("accept_invitation" as any, {
    p_code: input.code.toUpperCase().trim(),
    p_user_id: input.user_id,
    p_full_name: input.full_name.trim(),
    p_email: input.email.trim(),
    p_whatsapp: input.whatsapp.trim(),
    p_ncni: input.ncni?.trim() || null,
    p_lieu_habitation: input.lieu_habitation?.trim() || null,
    p_avatar_url: input.avatar_url || null,
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
