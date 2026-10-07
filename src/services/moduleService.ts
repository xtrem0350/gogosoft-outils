import { supabase } from "@/integrations/supabase/client";
import { createShop, getUserShops, type Shop } from "@/services/shopService";

const PENDING_SELECTION_KEY = "gogosoft.pendingModuleSelection";

/**
 * Sélection de modules faite dans la fenêtre de tarification.
 */
export interface ModulePurchaseSelection {
  moduleCodes: string[];
  storefrontCodes: string[];
  licenseCode: string | null;
  subscriptionCode: string | null;
  shopSubscriptionCode: string | null;
  durationMonths: number;
  domainCode: string | null;
  priceFcfa: number;
  trial: boolean;
}

export interface ActivityModule {
  code: string;
  label: string;
  icon: string;
  description: string;
}

/** Plan tarifaire historique (page admin des prix). */
export interface PricingPlan {
  plan_code: string;
  plan_label: string;
  min_modules: number;
  max_modules: number;
  monthly_price_fcfa: number;
  annual_price_fcfa: number;
}

/** Tarif d'un module applicatif (table module_pricing). */
export interface ModulePricing {
  code: string;
  label: string;
  icon: string | null;
  monthly_price_fcfa: number;
  description: string | null;
}

/** Licence selon le nombre de modules (table license_pricing). */
export interface LicensePricing {
  code: string;
  label: string;
  min_modules: number;
  max_modules: number;
  price_fcfa: number;
  description: string | null;
}

/** Abonnement application ou vitrine (table subscription_pricing). */
export interface SubscriptionPricing {
  code: string;
  label: string;
  type: "app" | "shop";
  duration_months: number;
  price_fcfa: number;
  description: string | null;
}

/** Tarif de nom de domaine (table domain_pricing). */
export interface DomainPricing {
  code: string;
  label: string;
  extension: string;
  annual_price_fcfa: number;
  description: string | null;
}

const STOREFRONT_CODES = ["shop_phone", "shop_computer"];

export interface ModulePricingSummary {
  appPlan: PricingPlan | null;
  storefrontPlan: PricingPlan | null;
  monthlyPrice: number;
  annualPrice: number;
  planCode: string;
}

/**
 * Les tables de tarification (license_pricing, subscription_pricing,
 * module_pricing, domain_pricing) ne sont pas encore dans les types générés :
 * on passe par un accès non typé, limité à ce fichier.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pricingTable(table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

/** Calcule le récapitulatif tarifaire historique à partir des plans. */
export function getModulePricingSummary(
  plans: PricingPlan[],
  moduleCodes: string[],
  storefrontCodes: string[],
): ModulePricingSummary {
  const uniqueModules = [...new Set(moduleCodes)];
  const uniqueStorefronts = [...new Set(storefrontCodes)];
  const appPlanCode =
    uniqueModules.length === 0
      ? null
      : uniqueModules.length === 1
        ? "lic_1module"
        : uniqueModules.length === 2
          ? "lic_2modules"
          : "lic_all";
  const storefrontPlanCode =
    uniqueStorefronts.length === 0 ? null : uniqueStorefronts.length === 1 ? "shop_1" : "shop_2";
  const appPlan = plans.find((plan) => plan.plan_code === appPlanCode) ?? null;
  const storefrontPlan = plans.find((plan) => plan.plan_code === storefrontPlanCode) ?? null;
  return {
    appPlan,
    storefrontPlan,
    monthlyPrice: (appPlan?.monthly_price_fcfa ?? 0) + (storefrontPlan?.monthly_price_fcfa ?? 0),
    annualPrice: (appPlan?.annual_price_fcfa ?? 0) + (storefrontPlan?.annual_price_fcfa ?? 0),
    planCode: [appPlanCode, storefrontPlanCode].filter(Boolean).join("+") || "free",
  };
}

/** Liste les modules d'activité actifs (table activity_modules). */
export async function getAvailableModules(): Promise<ActivityModule[]> {
  const { data, error } = await supabase
    .from("activity_modules")
    .select("code, label, icon, description")
    .eq("is_active", true)
    .order("label");
  if (error) throw error;
  return (data ?? []) as ActivityModule[];
}

/** Liste les codes de modules activés pour une boutique. */
export async function getShopModules(shopId: string): Promise<string[]> {
  if (!shopId) return [];
  const { data, error } = await supabase
    .from("shop_modules")
    .select("module_code")
    .eq("shop_id", shopId);
  if (error) throw error;
  return ((data ?? []) as Array<{ module_code: string }>).map((module) => module.module_code);
}

/** Active des modules pour une boutique. */
export async function enableShopModules(shopId: string, moduleCodes: string[]): Promise<void> {
  const uniqueCodes = [...new Set(moduleCodes)];
  if (!shopId || uniqueCodes.length === 0) return;
  const rows = uniqueCodes.map((module_code) => ({ shop_id: shopId, module_code }));
  const { error } = await supabase
    .from("shop_modules")
    .upsert(rows, { onConflict: "shop_id,module_code" });
  if (error) throw error;
}

/** Désactive un module pour une boutique. */
export async function disableShopModule(shopId: string, moduleCode: string): Promise<void> {
  if (!shopId) return;
  const { error } = await supabase
    .from("shop_modules")
    .delete()
    .eq("shop_id", shopId)
    .eq("module_code", moduleCode);
  if (error) throw error;
}

/** Liste les tarifs des modules applicatifs actifs. */
export async function getModulePricing(): Promise<ModulePricing[]> {
  const { data, error } = await pricingTable("module_pricing")
    .select("code, label, icon, monthly_price_fcfa, description")
    .eq("is_active", true)
    .order("monthly_price_fcfa");
  if (error) throw error;
  return (data ?? []) as ModulePricing[];
}

/** Liste les licences actives. */
export async function getLicensePricing(): Promise<LicensePricing[]> {
  const { data, error } = await pricingTable("license_pricing")
    .select("code, label, min_modules, max_modules, price_fcfa, description")
    .eq("is_active", true)
    .order("min_modules");
  if (error) throw error;
  return (data ?? []) as LicensePricing[];
}

/** Liste les abonnements actifs, éventuellement filtrés par type. */
export async function getSubscriptionPricing(
  type?: "app" | "shop",
): Promise<SubscriptionPricing[]> {
  let query = pricingTable("subscription_pricing")
    .select("code, label, type, duration_months, price_fcfa, description")
    .eq("is_active", true)
    .order("duration_months");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SubscriptionPricing[];
}

/** Liste les tarifs de domaines actifs. */
export async function getDomainPricing(): Promise<DomainPricing[]> {
  const { data, error } = await pricingTable("domain_pricing")
    .select("code, label, extension, annual_price_fcfa, description")
    .eq("is_active", true)
    .order("annual_price_fcfa");
  if (error) throw error;
  return (data ?? []) as DomainPricing[];
}

/** Trouve la licence correspondant à un nombre de modules. */
export function getLicenseForModuleCount(
  licenses: LicensePricing[],
  count: number,
): LicensePricing | null {
  return (
    licenses.find((license) => count >= license.min_modules && count <= license.max_modules) ?? null
  );
}

/**
 * Liste les plans historiques pour la page admin des prix.
 * Alimentée par license_pricing depuis la refonte tarifaire.
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const licenses = await getLicensePricing();
  return licenses.map((license) => ({
    plan_code: license.code,
    plan_label: license.label,
    min_modules: license.min_modules,
    max_modules: license.max_modules,
    monthly_price_fcfa: license.price_fcfa,
    annual_price_fcfa: license.price_fcfa,
  }));
}

/** Met à jour le prix d'une licence (page admin des prix). */
export async function updatePricing(
  planCode: string,
  monthlyPriceFcfa: number,
  _annualPriceFcfa: number,
  minModules?: number,
  maxModules?: number,
): Promise<void> {
  if (!Number.isInteger(monthlyPriceFcfa) || monthlyPriceFcfa < 0) {
    throw new Error("Le prix doit être un montant entier positif ou nul.");
  }
  if (
    (minModules !== undefined && (!Number.isInteger(minModules) || minModules < 1)) ||
    (maxModules !== undefined && (!Number.isInteger(maxModules) || maxModules < (minModules ?? 1)))
  ) {
    throw new Error("La plage de modules est invalide.");
  }
  const { error } = await pricingTable("license_pricing")
    .update({
      price_fcfa: monthlyPriceFcfa,
      ...(minModules === undefined ? {} : { min_modules: minModules }),
      ...(maxModules === undefined ? {} : { max_modules: maxModules }),
      updated_at: new Date().toISOString(),
    })
    .eq("code", planCode);
  if (error) throw error;
}

/** Trouve le plan historique correspondant à un nombre de modules. */
export function getPlanForModuleCount(plans: PricingPlan[], count: number): PricingPlan | null {
  return plans.find((plan) => count >= plan.min_modules && count <= plan.max_modules) ?? null;
}

/** Recalcule le prix de l'abonnement après changement de modules. */
export async function syncSubscriptionModules(moduleCodes: string[]): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Utilisateur non authentifié.");

  const selectedModules = [...new Set(moduleCodes)];
  const appCodes = selectedModules.filter((code) => !STOREFRONT_CODES.includes(code));
  const storefrontCodes = selectedModules.filter((code) => STOREFRONT_CODES.includes(code));
  const [licenses, { data: subscription, error: subscriptionError }] = await Promise.all([
    getLicensePricing(),
    supabase
      .from("subscriptions")
      .select("plan, domain_included")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (subscriptionError) throw subscriptionError;

  const license = getLicenseForModuleCount(licenses, Math.max(1, appCodes.length));
  const priceFcfa = appCodes.length > 0 ? (license?.price_fcfa ?? 0) : 0;
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      selected_modules: appCodes,
      storefront_modules: storefrontCodes,
      price_fcfa: priceFcfa,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** Enregistre localement une sélection de modules en attente de connexion. */
export function savePendingModuleSelection(selection: ModulePurchaseSelection): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_SELECTION_KEY, JSON.stringify(selection));
}

/** Lit la sélection de modules en attente, si elle est valide. */
export function getPendingModuleSelection(): ModulePurchaseSelection | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(PENDING_SELECTION_KEY);
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "moduleCodes" in value &&
      Array.isArray(value.moduleCodes) &&
      value.moduleCodes.every((code) => typeof code === "string") &&
      "durationMonths" in value &&
      typeof value.durationMonths === "number" &&
      "priceFcfa" in value &&
      typeof value.priceFcfa === "number"
    ) {
      const record = value as Record<string, unknown>;
      return {
        moduleCodes: value.moduleCodes as string[],
        storefrontCodes: Array.isArray(record.storefrontCodes)
          ? (record.storefrontCodes as unknown[]).filter(
              (code): code is string => typeof code === "string",
            )
          : [],
        licenseCode: typeof record.licenseCode === "string" ? record.licenseCode : null,
        subscriptionCode:
          typeof record.subscriptionCode === "string" ? record.subscriptionCode : null,
        shopSubscriptionCode:
          typeof record.shopSubscriptionCode === "string" ? record.shopSubscriptionCode : null,
        durationMonths: value.durationMonths,
        domainCode: typeof record.domainCode === "string" ? record.domainCode : null,
        priceFcfa: value.priceFcfa,
        trial: record.trial === true,
      };
    }
  } catch {
    window.localStorage.removeItem(PENDING_SELECTION_KEY);
  }
  return null;
}

/** Efface la sélection de modules en attente. */
export function clearPendingModuleSelection(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_SELECTION_KEY);
}

/**
 * Applique une sélection de modules : crée la boutique si besoin, active les
 * modules et enregistre l'abonnement (essai de 24 h ou payant).
 */
export async function applyModuleSelection(
  userId: string,
  selection: ModulePurchaseSelection,
): Promise<Shop> {
  const selectedModules = [...new Set(selection.moduleCodes)];
  const selectedStorefronts = [...new Set(selection.storefrontCodes)];
  const selectedCodes = [...selectedModules, ...selectedStorefronts];
  if (selectedCodes.length === 0) throw new Error("Sélectionnez au moins une option.");
  if (!selection.trial && selection.priceFcfa <= 0) {
    throw new Error("Le tarif calculé est invalide.");
  }

  const [shops, availableModules] = await Promise.all([getUserShops(), getAvailableModules()]);
  const availableCodes = new Set(availableModules.map((module) => module.code));
  if (selectedCodes.some((code) => !availableCodes.has(code))) {
    throw new Error("La sélection contient un module indisponible.");
  }

  const userShop = shops[0];
  const shop =
    userShop ??
    (await createShop({
      name: `Atelier ${(await supabase.auth.getUser()).data.user?.email?.split("@")[0] ?? "GogoSoft"}`,
    }));

  const currentCodes = await getShopModules(shop.id);
  await enableShopModules(shop.id, selectedCodes);
  const removedCodes = currentCodes.filter(
    (code) => availableCodes.has(code) && !selectedCodes.includes(code),
  );
  await Promise.all(removedCodes.map((code) => disableShopModule(shop.id, code)));

  const expiresAt = selection.trial
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : new Date(Date.now() + selection.durationMonths * 30 * 24 * 60 * 60 * 1000);
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      selected_modules: selectedModules,
      storefront_modules: selectedStorefronts,
      domain_included: selection.domainCode !== null,
      price_fcfa: selection.trial ? 0 : selection.priceFcfa,
      plan: selection.trial ? "trial" : "mensuel",
      status: "active",
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return shop;
}
