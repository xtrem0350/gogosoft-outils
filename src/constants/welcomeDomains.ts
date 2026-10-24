export const WELCOME_DOMAIN_LABELS = {
  "reparation-telephone": "Réparation Téléphone",
  "reparation-pc": "Réparation PC",
  "vente-telephone": "Vente Téléphone",
  "vente-pc": "Vente PC",
  "vitrine-telephone": "Vitrine Téléphone",
  "vitrine-pc": "Vitrine PC",
} as const;

export type WelcomeDomainId = keyof typeof WELCOME_DOMAIN_LABELS;

export const WELCOME_DOMAIN_IDS = Object.keys(WELCOME_DOMAIN_LABELS) as WelcomeDomainId[];

export function isWelcomeDomainId(value: unknown): value is WelcomeDomainId {
  return typeof value === "string" && WELCOME_DOMAIN_IDS.some((id) => id === value);
}
