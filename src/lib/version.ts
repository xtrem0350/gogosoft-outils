export const APP_VERSION = "1.001";

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  emoji: string;
  highlights: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.001",
    date: "2026-09-26",
    title: "Bienvenue sur GogoSoft Tools Manager",
    emoji: "🎉",
    highlights: [
      "🏠 Dashboard personnalisé avec vos statistiques en temps réel",
      "📱 Gestion multi-tâches : Téléphone, Ordinateur, Consommables",
      "🛒 Nouveau module Ventes avec paiement Wave / Orange Money",
      "👥 Fiches clients et réparations centralisées",
      "🔔 Notifications WhatsApp en un clic",
      "🎨 Nouveau thème Orange-Blanc-Vert aux couleurs de la Côte d'Ivoire",
    ],
  },
];
