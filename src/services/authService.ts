import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/types/database";

function getMissingSupabaseMigrationMessage(error: unknown): string | null {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";
  const text = `${code} ${message}`.toLowerCase();

  if (
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST301" ||
    text.includes("column") ||
    text.includes("fonction") ||
    text.includes("function") ||
    text.includes("does not exist") ||
    text.includes("pseudo") ||
    text.includes("avatar_url") ||
    text.includes("phone_country_code")
  ) {
    return "La migration Supabase du pseudo n'est pas encore appliquée. Exécute 20260923000000_pseudo.sql dans le SQL Editor.";
  }

  return null;
}

export async function checkPseudoExists(pseudo: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_pseudo_exists", {
    pseudo_input: pseudo.trim(),
  });
  if (error) {
    console.error("[authService] checkPseudoExists error:", error);
    return false;
  }
  return data === true;
}

/** Résout un identifiant vers un email de compte. */
export async function resolveEmailFromIdentifier(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const { data, error } = await supabase.rpc("get_email_by_identifier", { identifier: trimmed });
  if (error) {
    if (error.code === "PGRST116") return null;
    if (getMissingSupabaseMigrationMessage(error)) return null;
    throw error;
  }

  return typeof data === "string" && data.length > 0 ? data : null;
}

/** Connexion par identifiant (email, pseudo ou WhatsApp). */
export async function signInWithIdentifier(identifier: string, password: string) {
  const resolvedEmail = await resolveEmailFromIdentifier(identifier);
  if (!resolvedEmail) {
    return {
      data: null,
      error: { message: "Aucun compte trouvé avec cet identifiant", status: 400 },
    };
  }

  return supabase.auth.signInWithPassword({ email: resolvedEmail, password });
}

/** Télécharge un avatar utilisateur dans le bucket public avatars. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const bucket = "avatars";
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".png";
  const path = `${userId}/avatar${Date.now()}${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/png",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Inscription par e-mail / mot de passe. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  avatarFile?: File | null,
  pseudo?: string,
) {
  const normalizedPseudo = pseudo?.trim();
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { full_name: fullName, phone: phone ?? null, pseudo: normalizedPseudo ?? null },
    },
  });

  if (result.data.user && result.data.user.id) {
    const avatarUrl = avatarFile ? await uploadAvatar(result.data.user.id, avatarFile) : null;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: result.data.user.id,
        email,
        nom: fullName,
        phone: phone ?? null,
        pseudo: normalizedPseudo ?? null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (profileError) {
      const migrationMessage = getMissingSupabaseMigrationMessage(profileError);
      if (migrationMessage) {
        throw new Error(migrationMessage);
      }
      throw new Error(profileError.message || "Impossible de sauvegarder le profil.");
    }
  }

  return result;
}

/** Connexion par e-mail / mot de passe. */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Connexion via un compte Google. */
export async function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
}

/** Envoi d'un code OTP par SMS (si la connexion téléphone est activée). */
export async function sendPhoneOtp(phone: string) {
  return supabase.auth.signInWithOtp({ phone });
}

/** Vérification du code OTP reçu par SMS. */
export async function verifyPhoneOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

/** Déconnexion. */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Récupère le profil de l'utilisateur courant. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const roles = await getRoles(userId);
  return { ...data, role: roles[0] ?? null } as Profile;
}

/** Met à jour le profil de l'utilisateur courant. */
export async function updateProfile(userId: string, values: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

/** Récupère les rôles de l'utilisateur courant. */
export async function getRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}
