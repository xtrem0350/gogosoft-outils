import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/types/database";

/** Inscription par e-mail / mot de passe. */
export async function signUp(email: string, password: string, fullName: string, phone?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { full_name: fullName, phone: phone ?? null },
    },
  });
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
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Met à jour le profil de l'utilisateur courant. */
export async function updateProfile(userId: string, values: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  if (error) throw error;
}

/** Récupère les rôles de l'utilisateur courant. */
export async function getRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}
