/** Utilitaires WhatsApp : normalisation des numéros ivoiriens et liens wa.me. */

/** Nettoie un numéro : garde les chiffres et préfixe l'indicatif 225 si absent. */
export function normalizeWhatsapp(raw: string): string {
  const digits = (raw ?? "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("225")) return digits;
  if (digits.startsWith("00225")) return digits.slice(2);
  if (digits.startsWith("0")) return `225${digits.slice(1)}`;
  if (digits.length <= 10) return `225${digits}`;
  return digits;
}

/** Construit un lien wa.me avec message pré-rempli. */
export function buildWhatsappLink(raw: string, message?: string): string {
  const number = normalizeWhatsapp(raw);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

/** Message type envoyé au client quand la réparation avance. */
export function buildStatusMessage(options: {
  clientName: string;
  deviceModel: string;
  status: string;
  shopName?: string | null;
}): string {
  const labels: Record<string, string> = {
    en_attente: "est enregistré et en attente de prise en charge",
    en_cours: "est en cours de réparation",
    termine: "est réparé et prêt à être récupéré",
    livre: "vous a été remis",
  };
  const etat = labels[options.status] ?? "a été mis à jour";
  const atelier = options.shopName ? ` — ${options.shopName}` : "";
  return `Bonjour ${options.clientName}, votre ${options.deviceModel} ${etat}. Merci de votre confiance${atelier}.`;
}
