import { supabase } from "@/integrations/supabase/client";

export interface AdminTenant {
  id: string;
  name: string;
  email: string | null;
  plan: string | null;
  expiresAt: string | null;
  shops: number;
  createdAt: string;
  status: string;
}

export interface AdminStats {
  total_tenants: number;
  active_tenants: number;
  mrr_fcfa: number;
  churn_rate: number;
}

export interface AdminPayment {
  id: string;
  amount: number;
  method: string;
  plan: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

export interface AdminSubscription {
  user_id: string;
  plan: string;
  status: string;
  expires_at: string;
}

async function loadAdminData() {
  const [profilesResult, subscriptionsResult, shopsResult] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, created_at"),
    supabase.from("subscriptions").select("user_id, plan, status, expires_at"),
    supabase.from("shops").select("owner_id"),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (shopsResult.error) throw shopsResult.error;
  return {
    profiles: profilesResult.data ?? [],
    subscriptions: subscriptionsResult.data ?? [],
    shops: shopsResult.data ?? [],
  };
}

export async function getAllTenants(): Promise<AdminTenant[]> {
  const { profiles, subscriptions, shops } = await loadAdminData();
  return profiles.map((profile) => {
    const subscription = subscriptions.find((item) => item.user_id === profile.id);
    const shopCount = shops.filter((shop) => shop.owner_id === profile.id).length;
    return {
      id: profile.id,
      name: profile.full_name ?? profile.email ?? "Utilisateur",
      email: profile.email,
      plan: subscription?.plan ?? null,
      expiresAt: subscription?.expires_at ?? null,
      shops: shopCount,
      createdAt: profile.created_at,
      status: subscription?.status ?? "sans forfait",
    };
  });
}

export async function getGlobalStats(): Promise<AdminStats> {
  const { profiles, subscriptions } = await loadAdminData();
  const active = subscriptions.filter(
    (item) => item.status === "active" && new Date(item.expires_at).getTime() >= Date.now(),
  );
  const monthlyPlans = new Set(["monthly", "mensuel", "pro"]);
  const mrr = active.reduce((total, item) => total + (monthlyPlans.has(item.plan) ? 5000 : 0), 0);
  return {
    total_tenants: profiles.length,
    active_tenants: active.length,
    mrr_fcfa: mrr,
    churn_rate:
      profiles.length === 0
        ? 0
        : Math.round(((profiles.length - active.length) / profiles.length) * 100),
  };
}

export async function getAllPayments(limit = 20): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, method, plan, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AdminPayment[];
}

export async function getExpiringSubscriptions(days = 7): Promise<AdminSubscription[]> {
  const now = Date.now();
  const until = now + days * 24 * 60 * 60 * 1000;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan, status, expires_at")
    .gte("expires_at", new Date(now).toISOString())
    .lte("expires_at", new Date(until).toISOString())
    .order("expires_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminSubscription[];
}

export async function getSubscriptionsByPlan(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("subscriptions").select("plan");
  if (error) throw error;
  return (data ?? []).reduce<Record<string, number>>((result, item) => {
    result[item.plan] = (result[item.plan] ?? 0) + 1;
    return result;
  }, {});
}

export async function getRecentSignups(limit = 10): Promise<AdminTenant[]> {
  const tenants = await getAllTenants();
  return tenants.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getGrowthChart(
  months = 12,
): Promise<Array<{ month: string; signups: number }>> {
  const tenants = await getAllTenants();
  const now = new Date();
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1);
    const prefix = date.toISOString().slice(0, 7);
    return {
      month: prefix,
      signups: tenants.filter((tenant) => tenant.createdAt.startsWith(prefix)).length,
    };
  });
}
