export interface PricingPlan {
  id: string;
  title: string;
  price: number;
  subtitle: string;
  features: readonly string[];
  featured?: boolean;
}

export const DOMAIN_PRICE = 10000;
export const DOMAIN_ANNUAL_PRICE_FCFA = DOMAIN_PRICE;
export const BONUS_DAYS = 7;

export const PRICING_RULES = {
  allInOne: {
    id: "all_in_one",
    title: "Tout-en-un",
    price: 49000,
    subtitle: "Toutes les activités : ventes et réparations",
    features: ["Tous les modules illimités", "Support prioritaire"],
  },
  moduleUnitPrice: 15000,
  moduleDiscountRate: 0.10,
  moduleTitle: "Modules d'activité",
  domainPrice: 10000,
  smsPackPrice: 15000,
  smsPackLabel: "Pack SMS illimités (MTN, Moov, Orange) + WhatsApp API",
  trialDays: 7,
} as const;

export type PricingMode = "all_in_one" | "modules" | null;

export const INSTALLATION_NOTICE =
  "Votre compteur d'abonnement démarre officiellement à l'issue de la période des 7 jours gratuits de configuration et de paramétrage de votre compte.";

export function calculateModulePrice(activityModuleCount: number): number {
  const count = Math.max(0, Math.trunc(activityModuleCount));
  if (count === 0) return 0;
  const base = count * PRICING_RULES.moduleUnitPrice;
  return Math.round(count >= 2 ? base * (1 - PRICING_RULES.moduleDiscountRate) : base);
}

export function countActivityModules(ids: readonly string[]): number {
  return ids.filter((id) => id.startsWith("reparation-") || id.startsWith("vente-")).length;
}

export function countRepairModules(ids: readonly string[]): number {
  return ids.filter((id) => id.startsWith("reparation-")).length;
}

export function countSaleModules(ids: readonly string[]): number {
  return ids.filter((id) => id.startsWith("vente-")).length;
}

export function isAllInOne(ids: readonly string[]): boolean {
  const activityIds = new Set(ids.filter((id) => id.startsWith("reparation-") || id.startsWith("vente-")));
  return ["reparation-telephone", "reparation-pc", "vente-telephone", "vente-pc"].every((id) =>
    activityIds.has(id),
  );
}

export const WELCOME_PRICING: readonly PricingPlan[] = [
  {
    id: "app_1",
    title: "1 domaine",
    price: 15000,
    subtitle: "1 domaine / mois",
    features: ["1 domaine au choix", "Multi-appareils", "Support WhatsApp"],
  },
  {
    id: "app_3",
    title: "3 domaines",
    price: 35000,
    subtitle: "3 domaines / mois",
    featured: true,
    features: ["3 domaines au choix", "Support prioritaire", "Multi-appareils"],
  },
];
