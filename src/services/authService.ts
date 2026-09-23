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
  console.info("[authService] checkPseudoExists:start", { pseudo: pseudo.trim() });
  const { data, error } = await supabase.rpc("check_pseudo_exists", {
    pseudo_input: pseudo.trim(),
  });
  if (error) {
    console.error("[authService] checkPseudoExists error:", error);
    return false;
  }
  console.info("[authService] checkPseudoExists:success", { exists: data === true });
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
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
  const path = `${userId}/avatar${Date.now()}${extension}`;

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
    if (error) {
      console.error("[authService] uploadAvatar error:", error);
      throw error;
    }
  } catch (error) {
    console.error("[authService] uploadAvatar exception:", error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Inscription par e-mail / mot de passe. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  phoneCountryCode = "+225",
  avatarFile?: File | null,
  pseudo?: string,
) {
  const normalizedPseudo = pseudo?.trim();
  const countryCode = phoneCountryCode || "+225";
  const cleanPhone = phone?.replace(/\s+/g, "").replace(/\D/g, "") ?? "";
  const cleanCountryCode = countryCode.replace(/\D/g, "");
  const localPhone = cleanPhone.startsWith(cleanCountryCode)
    ? cleanPhone.slice(cleanCountryCode.length)
    : cleanPhone;
  const fullPhone = localPhone ? `${countryCode}${localPhone}` : null;
  console.info("[authService] signUp:auth-start", {
    email: email.trim(),
    pseudo: normalizedPseudo,
    hasPhone: Boolean(localPhone),
    hasAvatar: Boolean(avatarFile),
  });

  let result;
  try {
    result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: fullPhone,
          phone_country_code: countryCode,
          pseudo: normalizedPseudo ?? null,
        },
      },
    });
  } catch (error) {
    console.error("[authService] signUp:auth-exception", error);
    throw error;
  }

  if (result.error) {
    console.error("[authService] signUp:auth-error", result.error);
    return result;
  }

  console.info("[authService] signUp:auth-success", {
    userId: result.data.user?.id ?? null,
    sessionCreated: Boolean(result.data.session),
  });

  if (!result.data.user?.id) {
    console.error("[authService] signUp: no user returned");
    throw new Error("Aucun utilisateur retourné par Supabase.");
  }

  const userId = result.data.user.id;
  let avatarUrl: string | null = null;
  if (avatarFile) {
    console.info("[authService] signUp:avatar-start", { userId });
    try {
      avatarUrl = await uploadAvatar(userId, avatarFile);
      console.info("[authService] signUp:avatar-success", { userId });
    } catch (error) {
      console.warn("[authService] Upload avatar échoué, on continue:", error);
    }
  }

  console.info("[authService] signUp:profile-upsert-start", { userId });
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      nom: fullName,
      phone: fullPhone,
      phone_country_code: countryCode,
      pseudo: normalizedPseudo ?? null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("[authService] Erreur insert profiles:", profileError);
    const migrationMessage = getMissingSupabaseMigrationMessage(profileError);
    if (migrationMessage) {
      throw new Error(migrationMessage);
    }
    throw new Error(profileError.message || "Impossible de sauvegarder le profil.");
  }

  console.log("[authService] Profil créé avec succès pour", userId);

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
  console.info("[authService] getProfile:start", { userId });
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[authService] getProfile:error", { userId, error });
    throw error;
  }
  if (!data) {
    console.warn("[authService] getProfile:not-found", { userId });
    return null;
  }
  const roles = await getRoles(userId);
  console.info("[authService] getProfile:success", { userId, roleCount: roles.length });
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
  console.info("[authService] getRoles:start", { userId });
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.error("[authService] getRoles:error", { userId, error });
    throw error;
  }
  console.info("[authService] getRoles:success", { userId, roleCount: data?.length ?? 0 });
  return (data ?? []).map((r) => r.role as AppRole);
}
