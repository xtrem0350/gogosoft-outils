export const WELCOME_PRICING = [
  {
    id: "essentiel",
    title: "Essentiel",
    price: 6000,
    subtitle: "1 module / mois",
    features: ["1 module au choix", "Multi-appareils", "Support WhatsApp"],
  },
  {
    id: "pro",
    title: "Pro",
    price: 10000,
    subtitle: "2 modules / mois",
    featured: true,
    features: ["2 modules au choix", "Support prioritaire", "Multi-appareils"],
  },
  {
    id: "vitrine",
    title: "Vitrine",
    price: 20000,
    subtitle: "Boutique en ligne / mois",
    features: ["Vitrine tel/PC", "Commandes en ligne", "Domaine .com + SSL GRATUIT"],
  },
] as const;
