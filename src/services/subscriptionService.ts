/** Services de gestion de l'abonnement et de l'état de la licence. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";

export type SubscriptionPlan = "trial" | "mensuel" | "annuel";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expires_at: string | null;
  isActive: boolean;
  daysRemaining: number;
}

/** Récupère l'abonnement de l'utilisateur courant. */
export async function getMySubscription(): Promise<SubscriptionSummary | null> {
  const hasSession = await hasActiveSession();
  console.log("[subscriptionService] called", { hasSession, shopId: null });
  if (!hasSession) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      plan: "trial",
      status: "active",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      daysRemaining: 7,
    };
  }

  return normalizeSubscription(data as Record<string, unknown>);
}

/** Vérifie si l'abonnement est actif. */
export function isSubscriptionActive(
  subscription: Partial<SubscriptionSummary> | null | undefined,
): boolean {
  if (!subscription) return false;
  return subscription.isActive ?? subscription.status === "active";
}

/** Démarre une période d'essai. */
export async function startTrial(userId: string): Promise<SubscriptionSummary> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "trial",
        status: "active",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id" },
    )
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
export async function checkExpiration(): Promise<SubscriptionSummary | null> {
  const sub = await getMySubscription();
  if (!sub) return null;

  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
  const now = new Date();
  const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;

  if (isExpired && sub.status === "active") {
    await supabase.from("subscriptions").update({ status: "expired" }).eq("plan", sub.plan);
    return { ...sub, status: "expired", isActive: false, daysRemaining: 0 };
  }

  return sub;
}

function normalizeSubscription(data: Record<string, unknown>): SubscriptionSummary {
  const expiresAt = typeof data["expires_at"] === "string" ? data["expires_at"] : null;
  const plan = (data["plan"] as SubscriptionPlan) ?? "trial";
  const status = (data["status"] as SubscriptionStatus) ?? "active";
  const now = Date.now();
  const remainingMs = expiresAt ? new Date(expiresAt).getTime() - now : 0;
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return {
    plan,
    status,
    expires_at: expiresAt,
    isActive: status === "active" && (expiresAt ? new Date(expiresAt).getTime() > now : true),
    daysRemaining,
  };
}
