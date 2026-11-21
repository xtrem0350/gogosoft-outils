/** Services de gestion de l'abonnement et de l'état de la licence. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import { isDemoMode, readDemoSession } from "@/services/demoService";

export type SubscriptionPlan = "trial" | "mensuel" | "annuel";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "cancelled"
  | "inactive"
  | "pending";

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expires_at: string | null;
  started_at?: string | null;
  user_id?: string;
  isActive: boolean;
  daysRemaining: number;
  price_fcfa: number;
  selected_modules: string[];
  storefront_modules: string[];
  domain_included: boolean;
}

/** Récupère l'abonnement de l'utilisateur courant. */
export async function getMySubscription(userId?: string): Promise<SubscriptionSummary | null> {
  const demoSession = readDemoSession();
  if (demoSession) {
    const expiresAt = demoSession.expires_at;
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    return {
      plan: "trial",
      status: daysRemaining > 0 ? "active" : "expired",
      expires_at: expiresAt,
      started_at: null,
      isActive: daysRemaining > 0,
      daysRemaining,
      price_fcfa: 0,
      selected_modules: demoSession.modules.filter((code) => !code.startsWith("shop_")),
      storefront_modules: demoSession.modules.filter((code) => code.startsWith("shop_")),
      domain_included: false,
    };
  }
  const hasSession = await hasActiveSession();
  if (!hasSession) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const targetUserId = userId ?? userData.user?.id;

  if (!targetUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;
  return normalizeSubscription(data as Record<string, unknown>);
}

/** Vérifie si l'abonnement est actif. */
export function isSubscriptionActive(
  subscription: Partial<SubscriptionSummary> | null | undefined,
): boolean {
  if (!subscription) return false;
  if (subscription.isActive !== undefined) return subscription.isActive;
  if (subscription.status !== "active" && subscription.status !== "trial") return false;
  if (!subscription.expires_at) return subscription.status === "active";
  const expiresAt = new Date(subscription.expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Démarre une période d'essai. */
export async function startTrial(userId: string): Promise<SubscriptionSummary> {
  if (!userId) return Promise.reject(new Error("Utilisateur introuvable."));
  if (isDemoMode()) throw new Error("Un essai local ne crée pas d'abonnement Supabase.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return normalizeSubscription(existing as Record<string, unknown>);

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "trial",
      status: "trial",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error?.code === "23505") {
    const { data: concurrent, error: concurrentReadError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (concurrentReadError) throw concurrentReadError;
    return normalizeSubscription(concurrent as Record<string, unknown>);
  }
  if (error) throw error;
  return normalizeSubscription(data as Record<string, unknown>);
}

/** Retourne les jours restants d'essai, ou zéro si l'utilisateur n'est pas en essai. */
export async function getTrialDaysRemaining(userId: string): Promise<number> {
  if (!userId) throw new Error("Utilisateur introuvable.");
  if (isDemoMode()) {
    const subscription = await getMySubscription(userId);
    return subscription?.status === "trial" ? subscription.daysRemaining : 0;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.status !== "trial" || typeof data.expires_at !== "string") return 0;
  const expiryTime = new Date(data.expires_at).getTime();
  if (!Number.isFinite(expiryTime)) return 0;
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Met à jour les modules d'un essai sans réinitialiser sa période. */
export async function updateTrialModules(userId: string, moduleCodes: string[]): Promise<void> {
  if (!userId) return;
  if (isDemoMode()) throw new Error("Un essai local ne crée pas d'abonnement Supabase.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const uniqueCodes = [...new Set(moduleCodes)];
  const storefrontCodes = uniqueCodes.filter((code) => code.startsWith("shop_"));
  const appCodes = uniqueCodes.filter((code) => !code.startsWith("shop_"));
  const subscription = await startTrial(userId);
  if (subscription.status !== "trial") {
    throw new Error("Un abonnement existant empêche le démarrage de l'essai.");
  }
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "trial",
      status: "trial",
      selected_modules: appCodes,
      storefront_modules: storefrontCodes,
      price_fcfa: 0,
    })
    .eq("user_id", userId)
    .eq("status", "trial");
  if (error) throw error;
}

/** Renouvelle un abonnement en ajoutant des mois à son échéance actuelle. */
export async function renewSubscription(
  userId: string,
  months: number,
): Promise<SubscriptionSummary> {
  if (!userId) throw new Error("Utilisateur introuvable.");
  if (!Number.isInteger(months) || months < 1) {
    throw new Error("La durée du renouvellement est invalide.");
  }
  if (isDemoMode()) throw new Error("Le renouvellement est indisponible en mode démo.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");

  const { data: current, error: readError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) throw new Error("Abonnement introuvable.");

  const now = new Date();
  const previousExpiry =
    typeof current.expires_at === "string" ? new Date(current.expires_at) : now;
  const start =
    Number.isFinite(previousExpiry.getTime()) && previousExpiry > now
      ? previousExpiry
      : now;
  const expiresAt = new Date(start.getTime() + months * 30 * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: "active", expires_at: expiresAt.toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return normalizeSubscription(data as Record<string, unknown>);
}

/** Met à niveau le plan de l'utilisateur. */
export async function upgradePlan(
  userId: string,
  plan: SubscriptionPlan,
  durationDays: number,
): Promise<SubscriptionSummary> {
  if (!userId) return Promise.reject(new Error("Utilisateur introuvable."));
  if (isDemoMode()) throw new Error("La modification du forfait est indisponible en démo.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        expires_at: expiry,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return normalizeSubscription(data as Record<string, unknown>);
}

/** Vérifie l'expiration du plan et renvoie un résumé. */
export async function checkExpiration(userId?: string): Promise<SubscriptionSummary | null> {
  const sub = await getMySubscription(userId);
  if (!sub) return null;
  if (isDemoMode()) return sub;

  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
  const now = new Date();
  const isExpired = expiresAt
    ? !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()
    : false;

  if (isExpired && (sub.status === "active" || sub.status === "trial")) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const targetUserId = userId ?? userData.user?.id;
    if (!targetUserId) throw new Error("Utilisateur introuvable.");
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", targetUserId);
    if (error) throw error;
    return { ...sub, status: "expired", isActive: false, daysRemaining: 0 };
  }

  return sub;
}

function normalizeSubscription(data: Record<string, unknown>): SubscriptionSummary {
  const expiresAt = typeof data["expires_at"] === "string" ? data["expires_at"] : null;
  const plan = (data["plan"] as SubscriptionPlan) ?? "trial";
  const rawStatus = data["status"];
  const status: SubscriptionStatus =
    rawStatus === "trial" ||
    rawStatus === "active" ||
    rawStatus === "expired" ||
    rawStatus === "cancelled" ||
    rawStatus === "inactive" ||
    rawStatus === "pending"
      ? rawStatus
      : "inactive";
  const now = Date.now();
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const remainingMs = Number.isFinite(expiryTime) ? expiryTime - now : 0;
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const isActive =
    status === "active"
      ? !expiresAt || (Number.isFinite(expiryTime) && expiryTime > now)
      : status === "trial" && Number.isFinite(expiryTime) && expiryTime > now;

  return {
    plan,
    status,
    expires_at: expiresAt,
    started_at: typeof data["started_at"] === "string" ? data["started_at"] : null,
    ...(typeof data["user_id"] === "string" ? { user_id: data["user_id"] } : {}),
    isActive,
    daysRemaining,
    price_fcfa: typeof data["price_fcfa"] === "number" ? data["price_fcfa"] : 0,
    selected_modules: Array.isArray(data["selected_modules"])
      ? data["selected_modules"].filter((value): value is string => typeof value === "string")
      : [],
    storefront_modules: Array.isArray(data["storefront_modules"])
      ? data["storefront_modules"].filter((value): value is string => typeof value === "string")
      : [],
    domain_included: data["domain_included"] === true,
  };
}
