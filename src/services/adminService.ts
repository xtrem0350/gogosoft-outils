import { supabase } from "@/integrations/supabase/client";
import { updatePricing as savePricing, type ActivityModule } from "@/services/moduleService";

export interface AdminTenant {
  id: string;
  name: string;
  email: string | null;
  plan: string | null;
  expiresAt: string | null;
  shops: number;
  createdAt: string;
  status: string;
  modules: string[];
  shopDetails: Array<{ id: string; name: string }>;
}

export interface TenantFilters {
  status?: "active" | "late";
}

export interface AdminModule extends ActivityModule {
  subscriber_count: number;
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
    supabase
      .from("subscriptions")
      .select(
        "user_id, plan, status, expires_at, price_fcfa, selected_modules, storefront_modules",
      ),
    supabase.from("shops").select("id, name, owner_id"),
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

export async function getAllTenants(filters: TenantFilters = {}): Promise<AdminTenant[]> {
  const { profiles, subscriptions, shops } = await loadAdminData();
  const tenants = profiles.map((profile) => {
    const subscription = subscriptions.find((item) => item.user_id === profile.id);
    const tenantShops = shops.filter((shop) => shop.owner_id === profile.id);
    const expiresAt = subscription?.expires_at ?? null;
    const active =
      subscription?.status === "active" &&
      (!expiresAt || new Date(expiresAt).getTime() > Date.now());
    return {
      id: profile.id,
      name: profile.full_name ?? profile.email ?? "Utilisateur",
      email: profile.email,
      plan: subscription?.plan ?? null,
      expiresAt,
      shops: tenantShops.length,
      shopDetails: tenantShops.map((shop) => ({ id: shop.id, name: shop.name })),
      modules: [
        ...(subscription?.selected_modules ?? []),
        ...(subscription?.storefront_modules ?? []),
      ],
      createdAt: profile.created_at,
      status: active ? "active" : (subscription?.status ?? "late"),
    };
  });
  if (filters.status === "active") return tenants.filter((tenant) => tenant.status === "active");
  if (filters.status === "late") return tenants.filter((tenant) => tenant.status !== "active");
  return tenants;
}

export async function getTenantById(id: string): Promise<AdminTenant | null> {
  return (await getAllTenants()).find((tenant) => tenant.id === id) ?? null;
}

export async function getGlobalStats(): Promise<AdminStats> {
  const { profiles, subscriptions } = await loadAdminData();
  const active = subscriptions.filter(
    (item) => item.status === "active" && new Date(item.expires_at).getTime() >= Date.now(),
  );
  const mrr = active.reduce((total, item) => {
    const amount = item.price_fcfa ?? 0;
    return total + (item.plan === "annuel" || item.plan === "annual" ? amount / 12 : amount);
  }, 0);
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

export async function getAllModules(): Promise<AdminModule[]> {
  const [{ data: modules, error: moduleError }, { data: assignments, error: assignmentError }] =
    await Promise.all([
      supabase.from("activity_modules").select("code, label, icon, description").order("label"),
      supabase.from("shop_modules").select("module_code"),
    ]);
  if (moduleError) throw moduleError;
  if (assignmentError) throw assignmentError;
  return (modules ?? []).map((module) => ({
    ...module,
    icon: module.icon ?? "Package",
    description: module.description ?? "",
    subscriber_count: (assignments ?? []).filter((item) => item.module_code === module.code).length,
  }));
}

export async function createModule(data: {
  code: string;
  label: string;
  description?: string;
  icon?: string;
}): Promise<void> {
  const { error } = await supabase.from("activity_modules").insert({
    code: data.code,
    label: data.label,
    description: data.description ?? null,
    icon: data.icon ?? "Package",
    is_active: true,
  });
  if (error) throw error;
}

export async function updatePricing(
  planCode: string,
  monthly: number,
  annual: number,
  minModules?: number,
  maxModules?: number,
): Promise<void> {
  await savePricing(planCode, monthly, annual, minModules, maxModules);
}

export async function addModuleToTenant(
  shopId: string,
  moduleCode: string,
  type: "free" | "paid",
  duration: "permanent" | "temporary",
  motif: string,
): Promise<void> {
  const { data: inserted, error } = await supabase
    .from("shop_modules")
    .insert({ shop_id: shopId, module_code: moduleCode })
    .select("id")
    .single();
  if (error) throw error;
  const { data: userData } = await supabase.auth.getUser();
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "admin_module_added",
    entity: "shop_module",
    entity_id: inserted.id,
    shop_id: shopId,
    user_id: userData.user?.id ?? null,
    metadata: { moduleCode, type, duration, motif },
  });
  if (auditError) throw auditError;
}

export async function revokeTenant(
  shopId: string,
  reason: string,
  type: "suspend" | "expire" | "delete",
): Promise<void> {
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();
  if (shopError) throw shopError;
  const { data: userData } = await supabase.auth.getUser();
  const { error } =
    type === "delete"
      ? await supabase.from("subscriptions").delete().eq("user_id", shop.owner_id)
      : await supabase
          .from("subscriptions")
          .update({
            status: type === "suspend" ? "suspended" : "expired",
            ...(type === "expire" ? { expires_at: new Date().toISOString() } : {}),
          })
          .eq("user_id", shop.owner_id);
  if (error) throw error;
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: `admin_tenant_${type}`,
    entity: "subscription",
    entity_id: shop.owner_id,
    shop_id: shopId,
    user_id: userData.user?.id ?? null,
    metadata: { reason },
  });
  if (auditError) throw auditError;
}

export async function sendGlobalNotification(message: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("platform_notifications").insert({
    message,
    created_by: userData.user?.id ?? null,
  });
  if (error) throw error;
}

export async function getGlobalNotifications(): Promise<
  Array<{ id: string; message: string; created_at: string }>
> {
  const { data, error } = await supabase
    .from("platform_notifications")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; message: string; created_at: string }>;
}

export async function getSupportTickets(): Promise<
  Array<{
    id: string;
    user_id: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  }>
> {
  const { data, error } = await supabase
    .from("platform_support_tickets")
    .select("id, user_id, subject, message, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    user_id: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  }>;
}

export async function getTenantHistory(
  tenantId: string,
): Promise<Array<{ id: string; action: string; metadata: unknown; created_at: string }>> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, metadata, created_at")
    .eq("entity_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    action: string;
    metadata: unknown;
    created_at: string;
  }>;
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
