import { supabase } from "@/integrations/supabase/client";
import { updatePricing as savePricing, type ActivityModule } from "@/services/moduleService";
import { moduleIdsFromShopCodes, shopCodesFromModuleIds } from "@/types/modules";

export interface AdminTenant {
  id: string;
  name: string;
  email: string | null;
  isSuperAdmin: boolean;
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

export interface AdminSubscriptionPayment {
  id: string;
  shop_id: string | null;
  shop_name: string;
  owner_name: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export interface SuperAdminCashEntry {
  id: string;
  amount: number;
  currency: string;
  source: string;
  reference: string | null;
  description: string | null;
  created_at: string;
  owner_name: string | null;
}

export interface SuperAdminCashStats {
  today: number;
  month: number;
  pending: number;
}

export interface CashValidatedSubscription {
  user_id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
}

export interface AdminSubscription {
  user_id: string;
  plan: string;
  status: string;
  expires_at: string;
}

const PROTECTED_SUBSCRIBER_IDS = new Set([
  "c86f8569-bbcd-4207-be36-9cce86b654cd",
  "ec3f5f29-e0c1-4c2a-b94f-55057f40b730",
  "3e314d77-3bd0-42f4-b96e-3ef845526f46",
  "627d76b2-54bb-491f-a8f3-00054e07630f",
]);

export function isProtectedSubscriberId(userId: string): boolean {
  return PROTECTED_SUBSCRIBER_IDS.has(userId);
}

// These tables and the transaction RPC are not in the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminTable(table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

async function loadAdminData() {
  const [profilesResult, subscriptionsResult, shopsResult] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, is_super_admin, created_at"),
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
      isSuperAdmin: profile.is_super_admin === true,
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

export async function deleteSubscriber(userId: string): Promise<void> {
  const targetId = userId.trim();
  if (!targetId) throw new Error("Compte à supprimer manquant.");
  if (isProtectedSubscriberId(targetId)) {
    throw new Error("Ce compte est protégé et ne peut pas être supprimé.");
  }

  const { data, error } = await supabase.functions.invoke<{ success: boolean }>("delete-user", {
    body: { userId: targetId },
  });
  if (error) throw new Error(error.message || "Impossible de supprimer ce compte.");
  if (data?.success !== true) throw new Error("La suppression du compte n'a pas été confirmée.");
}

export async function resetSaas(): Promise<number> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    deletedUsers: number;
  }>("reset-saas", { body: { confirmation: "RESET" } });
  if (error) throw new Error(error.message || "Impossible de réinitialiser le SaaS.");
  if (
    data?.success !== true ||
    !Number.isInteger(data.deletedUsers) ||
    data.deletedUsers < 0
  ) {
    throw new Error("La réinitialisation du SaaS n'a pas été confirmée.");
  }
  return data.deletedUsers;
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

export async function getAllSubscriptionPayments(): Promise<AdminSubscriptionPayment[]> {
  const { data, error } = await adminTable("subscription_invoices")
    .select(
      "id, shop_id, user_id, total_amount, payment_status, payment_method, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const payments = (data ?? []) as Array<{
    id: string;
    shop_id: string | null;
    user_id: string;
    total_amount: number | string;
    payment_status: string;
    payment_method: string;
    created_at: string;
  }>;
  if (payments.length === 0) return [];

  const shopIds = [
    ...new Set(
      payments
        .map((payment) => payment.shop_id)
        .filter((shopId): shopId is string => shopId !== null),
    ),
  ];
  const ownerIds = [...new Set(payments.map((payment) => payment.user_id))];
  const [
    { data: shops, error: shopsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    shopIds.length
      ? supabase.from("shops").select("id, name").in("id", shopIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("profiles").select("id, full_name, email").in("id", ownerIds),
  ]);
  if (shopsError) throw shopsError;
  if (profilesError) throw profilesError;

  const shopNames = new Map((shops ?? []).map((shop) => [shop.id, shop.name]));
  const ownerNames = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name ?? profile.email ?? profile.id,
    ]),
  );

  return payments.map((payment) => {
    const amount = Number(payment.total_amount);
    if (!Number.isFinite(amount)) {
      throw new Error(`Montant invalide pour le paiement ${payment.id}.`);
    }
    return {
      id: payment.id,
      shop_id: payment.shop_id,
      shop_name: payment.shop_id
        ? shopNames.get(payment.shop_id) ?? payment.shop_id
        : "—",
      owner_name: ownerNames.get(payment.user_id) ?? payment.user_id,
      amount,
      payment_status: payment.payment_status,
      payment_method: payment.payment_method,
      created_at: payment.created_at,
    };
  });
}

export async function validateCashPayment(
  invoiceId: string,
  paymentMethod: "cash" | "wave" | "orange_money" | "mtn_momo",
  paymentReference: string | null,
): Promise<{ success: true; subscription_id: string; expires_at: string }> {
  if (!invoiceId) throw new Error("Facture manquante.");
  if (paymentMethod !== "cash" && !paymentReference?.trim()) {
    throw new Error("La référence de transaction est obligatoire.");
  }

  const { data, error } = await supabase.rpc("validate_cash_payment" as never, {
    p_invoice_id: invoiceId,
    p_payment_method: paymentMethod,
    p_payment_reference: paymentReference?.trim() || null,
  } as never);
  if (error) {
    throw new Error(error.message || "Impossible de valider la facture.");
  }

  const response = data as
    | { success?: unknown; subscription_id?: unknown; expires_at?: unknown }
    | null;
  if (response?.success !== true ||
      typeof response.subscription_id !== "string" ||
      typeof response.expires_at !== "string") {
    throw new Error("La validation n'a pas activé l'abonnement.");
  }
  return {
    success: true,
    subscription_id: response.subscription_id,
    expires_at: response.expires_at,
  };
}

export async function getSuperAdminCashEntries(filters?: {
  from?: Date;
  to?: Date;
}): Promise<SuperAdminCashEntry[]> {
  let query = adminTable("super_admin_cash_entries")
    .select("id, amount, currency, source, reference, description, created_at")
    .order("created_at", { ascending: false });
  if (filters?.from) query = query.gte("created_at", filters.from.toISOString());
  if (filters?.to) query = query.lte("created_at", filters.to.toISOString());

  const { data, error } = await query;
  if (error) throw error;

  const entries = (data ?? []) as Array<
    Omit<SuperAdminCashEntry, "owner_name" | "amount"> & {
      amount: number | string;
    }
  >;
  const paymentIds = [
    ...new Set(
      entries
        .map((entry) => entry.reference)
        .filter((reference): reference is string => Boolean(reference)),
    ),
  ];
  if (entries.length === 0 || paymentIds.length === 0) {
    return entries.map((entry) => {
      const amount = Number(entry.amount);
      if (!Number.isFinite(amount)) {
        throw new Error(`Montant invalide pour l'entrée de caisse ${entry.id}.`);
      }
      return { ...entry, amount, owner_name: null };
    });
  }

  const { data: payments, error: paymentsError } = await adminTable("subscription_invoices")
    .select("id, user_id")
    .in("id", paymentIds);
  if (paymentsError) throw paymentsError;
  const paymentRows = (payments ?? []) as Array<{ id: string; user_id: string }>;
  const ownerIds = [...new Set(paymentRows.map((payment) => payment.user_id))];
  const { data: profiles, error: profilesError } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const paymentOwners = new Map(paymentRows.map((payment) => [payment.id, payment.user_id]));
  const ownerNames = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name ?? profile.email ?? profile.id,
    ]),
  );
  return entries.map((entry) => {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount)) {
      throw new Error(`Montant invalide pour l'entrée de caisse ${entry.id}.`);
    }
    const ownerId = entry.reference ? paymentOwners.get(entry.reference) : undefined;
    return {
      ...entry,
      amount,
      owner_name: ownerId ? ownerNames.get(ownerId) ?? ownerId : null,
    };
  });
}

export async function getSuperAdminCashStats(): Promise<SuperAdminCashStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    { data: entries, error: entriesError },
    { data: pendingPayments, error: pendingError },
  ] = await Promise.all([
    adminTable("super_admin_cash_entries")
      .select("amount, created_at")
      .gte("created_at", monthStart.toISOString()),
    adminTable("subscription_invoices")
      .select("total_amount")
      .in("payment_status", ["pending", "en_attente_paiement_espece"]),
  ]);
  if (entriesError) throw entriesError;
  if (pendingError) throw pendingError;

  const entryRows = (entries ?? []) as Array<{
    amount: number | string;
    created_at: string;
  }>;
  const pendingRows = (pendingPayments ?? []) as Array<{ total_amount: number | string }>;
  const sumAmounts = <T,>(rows: T[], readAmount: (row: T) => number | string) =>
    rows.reduce((total, row) => {
      const amount = Number(readAmount(row));
      if (!Number.isFinite(amount)) throw new Error("Un montant de caisse est invalide.");
      return total + amount;
    }, 0);

  return {
    today: sumAmounts(
      entryRows.filter((entry) => new Date(entry.created_at) >= todayStart),
      (entry) => entry.amount,
    ),
    month: sumAmounts(entryRows, (entry) => entry.amount),
    pending: sumAmounts(pendingRows, (payment) => payment.total_amount),
  };
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
