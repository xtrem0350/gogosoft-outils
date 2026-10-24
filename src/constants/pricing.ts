export interface PricingPlan {
  id: string;
  title: string;
  price: number;
  subtitle: string;
  features: readonly string[];
  featured?: boolean;
}

export const DOMAIN_ANNUAL_PRICE_FCFA = 10000;

export const WELCOME_PRICING: readonly PricingPlan[] = [
  {
    id: "essentiel",
    title: "1 module",
    price: 15000,
    subtitle: "1 module / mois",
    features: ["1 module au choix", "Multi-appareils", "Support WhatsApp"],
  },
  {
    id: "pro",
    title: "3 modules",
    price: 35000,
    subtitle: "3 modules / mois",
    featured: true,
    features: ["3 modules au choix", "Support prioritaire", "Multi-appareils"],
  },
  {
    id: "vitrine",
    title: "Vitrine",
    price: 25000,
    subtitle: "Boutique en ligne / mois",
    features: [
      "Vitrine tel/PC",
      "Commandes en ligne",
      `Domaine en option : ${DOMAIN_ANNUAL_PRICE_FCFA.toLocaleString("fr-FR")} FCFA/an`,
    ],
  },
];
