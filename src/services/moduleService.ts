import { supabase } from "@/integrations/supabase/client";
import { createShop, getUserShops, type Shop } from "@/services/shopService";

const PENDING_SELECTION_KEY = "gogosoft.pendingModuleSelection";

export interface ModulePurchaseSelection {
  moduleCodes: string[];
  storefrontCodes: string[];
  planCode: string;
  billingCycle: "monthly" | "annual";
  priceFcfa: number;
  domainIncluded: boolean;
}

export interface ActivityModule {
  code: string;
  label: string;
  icon: string;
  description: string;
}

export interface PricingPlan {
  plan_code: string;
  plan_label: string;
  min_modules: number;
  max_modules: number;
  monthly_price_fcfa: number;
  annual_price_fcfa: number;
}

const STOREFRONT_CODES = ["shop_phone", "shop_computer"];

export interface ModulePricingSummary {
  appPlan: PricingPlan | null;
  storefrontPlan: PricingPlan | null;
  monthlyPrice: number;
  annualPrice: number;
  planCode: string;
}

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
        ? "app_1"
        : uniqueModules.length === 2
          ? "app_2"
          : "app_all";
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

export async function getAvailableModules(): Promise<ActivityModule[]> {
  const { data, error } = await supabase
    .from("activity_modules")
    .select("code, label, icon, description")
    .eq("is_active", true)
    .order("label");
  if (error) throw error;
  return (data ?? []) as ActivityModule[];
}

export async function getShopModules(shopId: string): Promise<string[]> {
  if (!shopId) return [];
  const { data, error } = await supabase
    .from("shop_modules")
    .select("module_code")
    .eq("shop_id", shopId);
  if (error) throw error;
  return ((data ?? []) as Array<{ module_code: string }>).map((module) => module.module_code);
}

export async function enableShopModules(shopId: string, moduleCodes: string[]): Promise<void> {
  const uniqueCodes = [...new Set(moduleCodes)];
  if (!shopId || uniqueCodes.length === 0) return;
  const rows = uniqueCodes.map((module_code) => ({ shop_id: shopId, module_code }));
  const { error } = await supabase
    .from("shop_modules")
    .upsert(rows, { onConflict: "shop_id,module_code" });
  if (error) throw error;
}

export async function disableShopModule(shopId: string, moduleCode: string): Promise<void> {
  if (!shopId) return;
  const { error } = await supabase
    .from("shop_modules")
    .delete()
    .eq("shop_id", shopId)
    .eq("module_code", moduleCode);
  if (error) throw error;
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from("pricing_config")
    .select(
      "plan_code, plan_label, min_modules, max_modules, monthly_price_fcfa, annual_price_fcfa",
    )
    .eq("is_active", true)
    .order("min_modules");
  if (error) throw error;
  return (data ?? []) as PricingPlan[];
}

export async function updatePricing(
  planCode: string,
  monthlyPriceFcfa: number,
  annualPriceFcfa: number,
  minModules?: number,
  maxModules?: number,
): Promise<void> {
  if (!Number.isInteger(monthlyPriceFcfa) || monthlyPriceFcfa < 0) {
    throw new Error("Le prix mensuel doit être un montant entier positif ou nul.");
  }
  if (!Number.isInteger(annualPriceFcfa) || annualPriceFcfa < 0) {
    throw new Error("Le prix annuel doit être un montant entier positif ou nul.");
  }
  if (
    (minModules !== undefined && (!Number.isInteger(minModules) || minModules < 1)) ||
    (maxModules !== undefined && (!Number.isInteger(maxModules) || maxModules < (minModules ?? 1)))
  ) {
    throw new Error("La plage de modules est invalide.");
  }
  const { error } = await supabase
    .from("pricing_config")
    .update({
      monthly_price_fcfa: monthlyPriceFcfa,
      annual_price_fcfa: annualPriceFcfa,
      ...(minModules === undefined ? {} : { min_modules: minModules }),
      ...(maxModules === undefined ? {} : { max_modules: maxModules }),
      updated_at: new Date().toISOString(),
    })
    .eq("plan_code", planCode);
  if (error) throw error;
}

export function getPlanForModuleCount(plans: PricingPlan[], count: number): PricingPlan | null {
  return plans.find((plan) => count >= plan.min_modules && count <= plan.max_modules) ?? null;
}

export async function syncSubscriptionModules(moduleCodes: string[]): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Utilisateur non authentifié.");

  const selectedModules = [...new Set(moduleCodes)];
  const appCodes = selectedModules.filter((code) => !STOREFRONT_CODES.includes(code));
  const storefrontCodes = selectedModules.filter((code) => STOREFRONT_CODES.includes(code));
  const [plans, { data: subscription, error: subscriptionError }] = await Promise.all([
    getPricingPlans(),
    supabase
      .from("subscriptions")
      .select("plan, domain_included")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (subscriptionError) throw subscriptionError;

  const pricing = getModulePricingSummary(plans, appCodes, storefrontCodes);
  const annual = subscription?.plan === "annuel";
  const priceFcfa = annual
    ? pricing.annualPrice + (subscription?.domain_included ? 10000 : 0)
    : pricing.monthlyPrice;
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

export function savePendingModuleSelection(selection: ModulePurchaseSelection): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_SELECTION_KEY, JSON.stringify(selection));
}

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
      (!("storefrontCodes" in value) ||
        (Array.isArray(value.storefrontCodes) &&
          value.storefrontCodes.every((code) => typeof code === "string"))) &&
      "planCode" in value &&
      typeof value.planCode === "string" &&
      "billingCycle" in value &&
      (value.billingCycle === "monthly" || value.billingCycle === "annual") &&
      "priceFcfa" in value &&
      typeof value.priceFcfa === "number" &&
      "domainIncluded" in value &&
      typeof value.domainIncluded === "boolean"
    ) {
      return {
        ...value,
        storefrontCodes:
          "storefrontCodes" in value && Array.isArray(value.storefrontCodes)
            ? value.storefrontCodes.filter((code): code is string => typeof code === "string")
            : [],
      } as ModulePurchaseSelection;
    }
  } catch {
    window.localStorage.removeItem(PENDING_SELECTION_KEY);
  }
  return null;
}

export function clearPendingModuleSelection(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_SELECTION_KEY);
}

export async function applyModuleSelection(
  userId: string,
  selection: ModulePurchaseSelection,
): Promise<Shop> {
  const selectedModules = [...new Set(selection.moduleCodes)];
  const selectedStorefronts = [...new Set(selection.storefrontCodes)];
  const selectedCodes = [...selectedModules, ...selectedStorefronts];
  if (selectedCodes.length === 0) throw new Error("Sélectionnez au moins une option.");
  if (selection.domainIncluded && selection.billingCycle !== "annual") {
    throw new Error("Le domaine .com est disponible uniquement avec un abonnement annuel.");
  }

  const [shops, availableModules, plans] = await Promise.all([
    getUserShops(),
    getAvailableModules(),
    getPricingPlans(),
  ]);
  const availableCodes = new Set(availableModules.map((module) => module.code));
  if (selectedCodes.some((code) => !availableCodes.has(code))) {
    throw new Error("La sélection contient un module indisponible.");
  }
  const pricing = getModulePricingSummary(plans, selectedModules, selectedStorefronts);
  if (
    (selectedModules.length > 0 && !pricing.appPlan) ||
    (selectedStorefronts.length > 0 && !pricing.storefrontPlan)
  ) {
    throw new Error("Aucun tarif actif ne correspond à la sélection.");
  }
  const priceFcfa =
    selection.billingCycle === "annual"
      ? pricing.annualPrice + (selection.domainIncluded ? 10000 : 0)
      : pricing.monthlyPrice;
  if (priceFcfa <= 0) throw new Error("Le tarif calculé est invalide.");

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
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      selected_modules: selectedModules,
      storefront_modules: selectedStorefronts,
      domain_included: selection.domainIncluded,
      price_fcfa: priceFcfa,
      plan: selection.billingCycle === "annual" ? "annuel" : "mensuel",
      status: "active",
      expires_at: new Date(
        Date.now() + (selection.billingCycle === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return shop;
}
