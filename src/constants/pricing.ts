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
