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
    price: 99000,
    subtitle: "Toutes les activités : ventes, réparations et vitrines",
    features: ["Tous les modules illimités", "Vitrines incluses", "Support prioritaire"],
  },
  moduleUnitPrice: 15000,
  moduleDiscountRate: 0.10,
  moduleTitle: "Modules d'activité",
  vitrineTitle: "Vitrines en ligne",
  vitrinePrices: {
    single: 25000,
    duo: 45000,
  },
  domainPrice: 10000,
  smsPackPrice: 15000,
  smsPackLabel: "Pack SMS illimités (MTN, Moov, Orange) + WhatsApp API",
  trialDays: 7,
} as const;

export type PricingMode = "all_in_one" | "modules" | "vitrines" | null;

export const INSTALLATION_NOTICE =
  "Les 7 jours offerts en plus de votre période défien lors du paiement servent à la configuration technique de votre espace.";

export function calculateModulePrice(count: number): number {
  if (count === 0) return 0;
  const base = count * PRICING_RULES.moduleUnitPrice;
  if (count >= 2) {
    return Math.round(base - base * PRICING_RULES.moduleDiscountRate);
  }
  return base;
}

export function calculateVitrinePrice(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return PRICING_RULES.vitrinePrices.single;
  return PRICING_RULES.vitrinePrices.duo;
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
  {
    id: "shop_1",
    title: "Vitrine",
    price: 25000,
    subtitle: "Boutique en ligne / mois",
    features: [
      "Vitrine tel/PC",
      "Commandes en ligne",
      `Domaine en option : ${DOMAIN_PRICE.toLocaleString("fr-FR")} FCFA/an`,
    ],
  },
];
