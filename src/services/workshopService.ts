import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import type { WorkshopTicket } from "@/types/database";

export type { WorkshopTicket } from "@/types/database";

/** Identifiants des pannes prises en charge par l'atelier. */
export type IssueKey =
  | "ecran_casse"
  | "ne_sallume_pas"
  | "batterie_hs"
  | "connecteur_charge"
  | "camera"
  | "haut_parleur"
  | "micro"
  | "reseau"
  | "logiciel"
  | "oxydation";

/** Statut de suivi d'une fiche d'atelier. */
export type WorkshopStatus = WorkshopTicket["status"];

/** Diagnostic calculé à partir des pannes sélectionnées. */
export interface WorkshopDiagnosis {
  tools: string[];
  process: string[];
}

/** Données nécessaires à la création d'une fiche. */
export interface CreateTicketData {
  shop_id: string;
  client_name: string;
  client_whatsapp: string;
  device_model: string;
  device_processor?: string;
  device_imei?: string;
  device_sn?: string;
  device_os_version?: string;
  issues: IssueKey[];
  diagnosis?: WorkshopDiagnosis;
  notes?: string;
}

interface IssueDefinition {
  label: string;
  tools: string[];
  process: string[];
}

/** Référentiel métier des pannes et des moyens de réparation. */
export const ISSUES_DATABASE: Record<IssueKey, IssueDefinition> = {
  ecran_casse: {
    label: "Écran cassé",
    tools: ["Ventouse", "Médiator plastique", "Tournevis Y000", "Station à air chaud", "Adhésif B-7000"],
    process: ["Éteindre le téléphone", "Retirer la carte SIM", "Chauffer les bords de l'écran", "Insérer le médiator", "Décoller l'écran", "Débrancher la nappe", "Retirer l'écran", "Nettoyer les résidus d'adhésif", "Poser le nouvel écran", "Reconnecter la nappe", "Tester avant fermeture"],
  },
  ne_sallume_pas: { label: "Ne s'allume pas", tools: ["Alimentation de laboratoire", "Multimètre", "Tournevis de précision"], process: ["Inspecter les dommages visibles", "Mesurer la tension de la batterie", "Contrôler le connecteur de batterie", "Tester la carte mère", "Effectuer un démarrage contrôlé"] },
  batterie_hs: { label: "Batterie hors service", tools: ["Spatule plastique", "Tournevis de précision", "Batterie compatible"], process: ["Éteindre le téléphone", "Retirer la coque arrière", "Déconnecter la batterie", "Retirer l'ancienne batterie", "Installer la batterie neuve", "Tester la charge"] },
  connecteur_charge: { label: "Connecteur de charge", tools: ["Loupe", "Brosse antistatique", "Station à air chaud", "Fer à souder"], process: ["Inspecter et nettoyer le connecteur", "Tester le câble et le chargeur", "Déposer le connecteur endommagé", "Poser le nouveau connecteur", "Tester la charge et la connexion USB"] },
  camera: { label: "Caméra", tools: ["Tournevis de précision", "Pince antistatique", "Module caméra compatible"], process: ["Tester les caméras", "Débrancher le module", "Installer le module de remplacement", "Tester la mise au point et la vidéo"] },
  haut_parleur: { label: "Haut-parleur", tools: ["Brosse antistatique", "Tournevis de précision", "Module haut-parleur"], process: ["Tester le son", "Nettoyer la grille", "Remplacer le module si nécessaire", "Valider le volume et les appels"] },
  micro: { label: "Microphone", tools: ["Brosse antistatique", "Tournevis de précision", "Module microphone"], process: ["Tester l'enregistrement", "Nettoyer l'orifice du microphone", "Remplacer le module si nécessaire", "Valider les appels et les notes vocales"] },
  reseau: { label: "Réseau", tools: ["Carte SIM de test", "Multimètre", "Tournevis de précision"], process: ["Tester la carte SIM", "Vérifier les antennes", "Contrôler les connecteurs", "Réinitialiser les paramètres réseau", "Valider les appels et les données"] },
  logiciel: { label: "Logiciel", tools: ["Ordinateur", "Câble USB", "Outil de flash"], process: ["Sauvegarder les données", "Démarrer le diagnostic logiciel", "Réinstaller ou mettre à jour le système", "Restaurer les données", "Tester les fonctions principales"] },
  oxydation: { label: "Oxydation", tools: ["Alcool isopropylique", "Brosse antistatique", "Station à air chaud", "Microscope"], process: ["Éteindre et déconnecter la batterie", "Documenter l'oxydation", "Nettoyer la carte mère", "Sécher les composants", "Tester les circuits", "Remplacer les pièces corrodées"] },
};

/** Fusionne les outils et les étapes sans doublons. */
export function generateDiagnosis(issues: IssueKey[]): WorkshopDiagnosis {
  const tools = new Set<string>();
  const process = new Set<string>();
  for (const issue of issues) {
    for (const tool of ISSUES_DATABASE[issue].tools) tools.add(tool);
    for (const step of ISSUES_DATABASE[issue].process) process.add(step);
  }
  return { tools: [...tools], process: [...process] };
}

/** Crée une fiche d'atelier et son diagnostic. */
export async function createTicket(data: CreateTicketData): Promise<WorkshopTicket> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const shopId = requireShopId(data.shop_id);
  console.log("[workshopService] called", { hasSession: true, shopId });
  try {
    const { data: auth } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = {
      ...data,
      shop_id: shopId,
      diagnosis: data.diagnosis ? { tools: data.diagnosis.tools, process: data.diagnosis.process } : null,
      created_by: auth.user?.id ?? null,
    };
    const { data: ticket, error } = await supabase.from("workshop_tickets").insert(payload).select().single();
    if (error) throw error;
    if (!ticket) throw new Error("Fiche atelier introuvable.");
    return ticket as WorkshopTicket;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}

/** Récupère les fiches d'une boutique, de la plus récente à la plus ancienne. */
export async function getTickets(shopId: string | null | undefined): Promise<WorkshopTicket[]> {
  if (!(await hasActiveSession()) || !shopId) return [];
  const { data, error } = await supabase
    .from("workshop_tickets")
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkshopTicket[];
}

/** Récupère une fiche par son identifiant. */
export async function getTicketById(id: string): Promise<WorkshopTicket | null> {
  if (!(await hasActiveSession())) return null;
  try {
    const { data, error } = await supabase.from("workshop_tickets").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const ticket = data as WorkshopTicket;
    return { ...ticket, notified_at: ticket["notified_at"] ?? null };
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    return null;
  }
}

/** Met à jour le statut d'une fiche. */
export async function updateTicketStatus(id: string, status: WorkshopStatus): Promise<WorkshopTicket> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  try {
    const { data, error } = await supabase.from("workshop_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    if (!data) throw new Error("Fiche atelier introuvable.");
    return data as WorkshopTicket;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}

/** Marque une réparation comme notifiée au client par WhatsApp. */
export async function markTicketNotified(id: string): Promise<WorkshopTicket> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  try {
    const { data, error } = await supabase
      .from("workshop_tickets")
      .update({ notified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Fiche atelier introuvable.");
    return data as WorkshopTicket;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("notified_at")) {
      const existing = await getTicketById(id);
      if (existing) return existing;
    }
    throw error;
  }
}

/** Supprime une fiche selon les politiques RLS Supabase. */
export async function deleteTicket(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  try {
    const { error } = await supabase.from("workshop_tickets").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}
