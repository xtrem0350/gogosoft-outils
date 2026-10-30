import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import {
  assignTicketToLocation,
  freeLocation,
  getLocationByTicketId,
} from "@/services/storageService";
import type { Database } from "@/integrations/supabase/types";
import type { WorkshopTicket } from "@/types/database";
import {
  DEMO_SHOP_ID,
  getDemoEvents,
  getDemoTickets,
  isDemoMode,
  readDemoSession,
  updateDemoSession,
} from "@/services/demoService";

export type { WorkshopTicket } from "@/types/database";
export type ActivityType = "phone" | "computer" | "consumable";

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
  | "oxydation"
  | "pc_carte_mere_hs"
  | "pc_disque_dur_defaillant"
  | "pc_ecran_casse"
  | "pc_clavier_defaillant"
  | "pc_surchauffe"
  | "pc_ne_demarre_pas"
  | "pc_batterie_ne_tient_plus"
  | "pc_connecteur_alimentation_casse"
  | "pc_windows_corrompu"
  | "pc_ventilateur_bruyant";

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
  activity_type?: ActivityType;
  category?: string;
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
  client_id?: string | null;
  entry_fee?: number;
  entry_fee_paid?: boolean;
  diagnostic_notes?: string;
  device_brand?: string;
  description?: string;
  ticket_number?: string;
  entry_fee_method?: string;
  technicien_id?: string | undefined;
  storage_location_id?: string | undefined;
}

export interface WorkshopPaymentRecord {
  id: string;
  shop_id: string;
  ticket_id: string;
  amount: number;
  method: string;
  payment_type: "entry" | "final";
  received_by: string | null;
  created_at: string;
}

export type WorkshopTicketUpdate = Partial<
  Pick<
    WorkshopTicket,
    | "status"
    | "price_estimate"
    | "price_final"
    | "notes"
    | "diagnostic_notes"
    | "notified_at"
    | "technicien_id"
    | "outils_utilises"
    | "pieces_consommees"
    | "price_final_paid"
    | "delivered_at"
  >
>;

interface TicketSequence {
  shop_id: string;
  date: string;
  last_number: number;
}

type WorkshopServiceDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      ticket_number_sequences: {
        Row: TicketSequence;
        Insert: TicketSequence;
        Update: Partial<TicketSequence>;
        Relationships: [];
      };
      workshop_payments: {
        Row: WorkshopPaymentRecord;
        Insert: Omit<WorkshopPaymentRecord, "id" | "created_at">;
        Update: Partial<Omit<WorkshopPaymentRecord, "id" | "created_at">>;
        Relationships: [];
      };
    };
  };
};

const workshopClient = supabase as unknown as SupabaseClient<WorkshopServiceDatabase>;
let demoTicketNumber = 0;

/** Génère un numéro de fiche unique pour la journée et la boutique. */
async function generateTicketNumber(shopId: string): Promise<string> {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  if (isDemoMode()) {
    demoTicketNumber += 1;
    return `F-${date}-${String(demoTicketNumber).padStart(4, "0")}`;
  }
  const sequenceDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  // TODO: régénérer les types Supabase (supabase gen types)
  const { data: current, error: readError } = await supabase
    .from("ticket_number_sequences" as any)
    .select("last_number")
    .eq("shop_id", shopId)
    .eq("date", sequenceDate)
    .maybeSingle() as { data: { last_number: number } | null; error: Error | null };
  if (readError) throw readError;
  const lastNumber = (current?.last_number ?? 0) + 1;
  const { error: upsertError } = await (supabase.from("ticket_number_sequences" as any) as any)
    .upsert(
      { shop_id: shopId, date: sequenceDate, last_number: lastNumber },
      { onConflict: "shop_id,date" },
    );
  if (upsertError) throw upsertError;
  return `F-${date}-${String(lastNumber).padStart(4, "0")}`;
}

/** Type d'événement enregistré dans l'historique d'une intervention. */
export type WorkshopEventType =
  | "received"
  | "diagnosed"
  | "in_progress"
  | "waiting_parts"
  | "completed"
  | "delivered"
  | "cancelled"
  | "note";

/** Événement de l'historique d'une fiche d'atelier. */
export interface WorkshopEvent {
  id: string;
  ticket_id: string | null;
  event_type: WorkshopEventType;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
}

/** Appareil déjà connu de la boutique, dédupliqué par IMEI. */
export interface KnownDevice {
  device_model: string;
  device_imei: string | null;
  device_sn: string | null;
  device_processor: string | null;
  device_os_version: string | null;
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
    tools: [
      "Ventouse",
      "Médiator plastique",
      "Tournevis Y000",
      "Station à air chaud",
      "Adhésif B-7000",
    ],
    process: [
      "Éteindre le téléphone",
      "Retirer la carte SIM",
      "Chauffer les bords de l'écran",
      "Insérer le médiator",
      "Décoller l'écran",
      "Débrancher la nappe",
      "Retirer l'écran",
      "Nettoyer les résidus d'adhésif",
      "Poser le nouvel écran",
      "Reconnecter la nappe",
      "Tester avant fermeture",
    ],
  },
  ne_sallume_pas: {
    label: "Ne s'allume pas",
    tools: ["Alimentation de laboratoire", "Multimètre", "Tournevis de précision"],
    process: [
      "Inspecter les dommages visibles",
      "Mesurer la tension de la batterie",
      "Contrôler le connecteur de batterie",
      "Tester la carte mère",
      "Effectuer un démarrage contrôlé",
    ],
  },
  batterie_hs: {
    label: "Batterie hors service",
    tools: ["Spatule plastique", "Tournevis de précision", "Batterie compatible"],
    process: [
      "Éteindre le téléphone",
      "Retirer la coque arrière",
      "Déconnecter la batterie",
      "Retirer l'ancienne batterie",
      "Installer la batterie neuve",
      "Tester la charge",
    ],
  },
  connecteur_charge: {
    label: "Connecteur de charge",
    tools: ["Loupe", "Brosse antistatique", "Station à air chaud", "Fer à souder"],
    process: [
      "Inspecter et nettoyer le connecteur",
      "Tester le câble et le chargeur",
      "Déposer le connecteur endommagé",
      "Poser le nouveau connecteur",
      "Tester la charge et la connexion USB",
    ],
  },
  camera: {
    label: "Caméra",
    tools: ["Tournevis de précision", "Pince antistatique", "Module caméra compatible"],
    process: [
      "Tester les caméras",
      "Débrancher le module",
      "Installer le module de remplacement",
      "Tester la mise au point et la vidéo",
    ],
  },
  haut_parleur: {
    label: "Haut-parleur",
    tools: ["Brosse antistatique", "Tournevis de précision", "Module haut-parleur"],
    process: [
      "Tester le son",
      "Nettoyer la grille",
      "Remplacer le module si nécessaire",
      "Valider le volume et les appels",
    ],
  },
  micro: {
    label: "Microphone",
    tools: ["Brosse antistatique", "Tournevis de précision", "Module microphone"],
    process: [
      "Tester l'enregistrement",
      "Nettoyer l'orifice du microphone",
      "Remplacer le module si nécessaire",
      "Valider les appels et les notes vocales",
    ],
  },
  reseau: {
    label: "Réseau",
    tools: ["Carte SIM de test", "Multimètre", "Tournevis de précision"],
    process: [
      "Tester la carte SIM",
      "Vérifier les antennes",
      "Contrôler les connecteurs",
      "Réinitialiser les paramètres réseau",
      "Valider les appels et les données",
    ],
  },
  logiciel: {
    label: "Logiciel",
    tools: ["Ordinateur", "Câble USB", "Outil de flash"],
    process: [
      "Sauvegarder les données",
      "Démarrer le diagnostic logiciel",
      "Réinstaller ou mettre à jour le système",
      "Restaurer les données",
      "Tester les fonctions principales",
    ],
  },
  oxydation: {
    label: "Oxydation",
    tools: ["Alcool isopropylique", "Brosse antistatique", "Station à air chaud", "Microscope"],
    process: [
      "Éteindre et déconnecter la batterie",
      "Documenter l'oxydation",
      "Nettoyer la carte mère",
      "Sécher les composants",
      "Tester les circuits",
      "Remplacer les pièces corrodées",
    ],
  },
  pc_carte_mere_hs: {
    label: "Carte mère défaillante",
    tools: ["Multimètre", "Tournevis de précision", "Loupe"],
    process: [
      "Inspecter visuellement la carte mère",
      "Contrôler les alimentations et les composants",
      "Identifier le composant défaillant",
      "Réparer ou remplacer la carte mère",
      "Tester les fonctions principales",
    ],
  },
  pc_disque_dur_defaillant: {
    label: "Disque dur défaillant",
    tools: ["Adaptateur SATA/USB", "Outil de diagnostic disque"],
    process: [
      "Vérifier l'état du disque",
      "Sauvegarder les données récupérables",
      "Remplacer le disque si nécessaire",
      "Réinstaller le système et vérifier les données",
    ],
  },
  pc_ecran_casse: {
    label: "Écran cassé",
    tools: ["Tournevis de précision", "Spatule plastique", "Écran compatible"],
    process: [
      "Éteindre et débrancher l'ordinateur",
      "Retirer le cadre de l'écran",
      "Déconnecter la nappe vidéo",
      "Installer l'écran de remplacement",
      "Tester l'affichage",
    ],
  },
  pc_clavier_defaillant: {
    label: "Clavier ne fonctionne plus",
    tools: ["Tournevis de précision", "Spatule plastique", "Clavier compatible"],
    process: [
      "Tester les touches et la connexion",
      "Débrancher l'ordinateur",
      "Remplacer ou reconnecter le clavier",
      "Vérifier toutes les touches",
    ],
  },
  pc_surchauffe: {
    label: "Surchauffe",
    tools: ["Tournevis de précision", "Brosse antistatique", "Pâte thermique"],
    process: [
      "Contrôler les températures et les aérations",
      "Nettoyer le système de refroidissement",
      "Remplacer la pâte thermique si nécessaire",
      "Vérifier les températures en fonctionnement",
    ],
  },
  pc_ne_demarre_pas: {
    label: "Ne démarre plus",
    tools: ["Adaptateur secteur de test", "Multimètre", "Tournevis de précision"],
    process: [
      "Vérifier l'adaptateur secteur et la prise",
      "Contrôler les voyants et les symptômes au démarrage",
      "Tester les composants d'alimentation",
      "Identifier la panne puis vérifier le démarrage",
    ],
  },
  pc_batterie_ne_tient_plus: {
    label: "Batterie ne tient plus",
    tools: ["Outil de diagnostic batterie", "Batterie compatible"],
    process: [
      "Contrôler l'état et les cycles de la batterie",
      "Vérifier le fonctionnement sur secteur",
      "Remplacer la batterie si nécessaire",
      "Valider l'autonomie et la charge",
    ],
  },
  pc_connecteur_alimentation_casse: {
    label: "Connecteur d'alimentation cassé",
    tools: ["Multimètre", "Tournevis de précision", "Connecteur compatible"],
    process: [
      "Vérifier le chargeur et le connecteur",
      "Contrôler la continuité électrique",
      "Remplacer ou ressouder le connecteur",
      "Tester la charge et le démarrage",
    ],
  },
  pc_windows_corrompu: {
    label: "Windows corrompu",
    tools: ["Clé USB de récupération", "Support de sauvegarde"],
    process: [
      "Évaluer l'état du système et des données",
      "Sauvegarder les données accessibles",
      "Réparer le démarrage ou réinstaller Windows",
      "Installer les pilotes et vérifier le système",
    ],
  },
  pc_ventilateur_bruyant: {
    label: "Ventilateur bruyant",
    tools: ["Tournevis de précision", "Brosse antistatique"],
    process: [
      "Localiser le ventilateur bruyant",
      "Nettoyer les pales et les aérations",
      "Remplacer le ventilateur s'il est endommagé",
      "Vérifier le bruit et le refroidissement",
    ],
  },
};

export const COMPUTER_ISSUE_KEYS: IssueKey[] = [
  "pc_carte_mere_hs",
  "pc_disque_dur_defaillant",
  "pc_ecran_casse",
  "pc_clavier_defaillant",
  "pc_surchauffe",
  "pc_ne_demarre_pas",
  "pc_batterie_ne_tient_plus",
  "pc_connecteur_alimentation_casse",
  "pc_windows_corrompu",
  "pc_ventilateur_bruyant",
];

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
  if (isDemoMode()) {
    const now = new Date().toISOString();
    const ticket: WorkshopTicket = {
      id: `demo-ticket-${crypto.randomUUID()}`,
      shop_id: DEMO_SHOP_ID,
      activity_type: data.activity_type ?? "phone",
      client_id: data.client_id ?? null,
      client_name: data.client_name,
      client_whatsapp: data.client_whatsapp,
      device_model: data.device_model,
      device_brand: data.device_brand ?? null,
      device_processor: data.device_processor ?? null,
      device_imei: data.device_imei ?? null,
      device_sn: data.device_sn ?? null,
      device_os_version: data.device_os_version ?? null,
      issues: data.issues,
      status: "en_attente_caissier_entree",
      diagnosis: data.diagnosis
        ? { tools: data.diagnosis.tools, process: data.diagnosis.process }
        : null,
      notes: data.notes ?? null,
      description: data.description ?? null,
      ticket_number: data.ticket_number ?? (await generateTicketNumber(data.shop_id)),
      price_estimate: null,
      price_final: null,
      notified_at: null,
      entry_fee: data.entry_fee ?? (data.activity_type === "consumable" ? null : 2000),
      entry_fee_paid: data.entry_fee_paid ?? false,
      entry_fee_method: data.entry_fee_method ?? null,
      technicien_id: data.technicien_id ?? null,
      diagnostic_notes: data.diagnostic_notes ?? null,
      created_by: null,
      created_at: now,
      updated_at: now,
    };
    updateDemoSession((session) => ({
      ...session,
      tickets: [ticket, ...session.tickets],
      workshop_payments: ticket.entry_fee_paid
        ? [
            ...(session.workshop_payments ?? []),
            {
              id: `demo-payment-${crypto.randomUUID()}`,
              shop_id: ticket.shop_id ?? DEMO_SHOP_ID,
              ticket_id: ticket.id,
              amount: ticket.entry_fee ?? 0,
              method: ticket.entry_fee_method ?? "cash",
              payment_type: "entry",
              received_by: null,
              created_at: now,
            },
          ]
        : session.workshop_payments ?? [],
      events: [
        {
          id: `demo-event-${crypto.randomUUID()}`,
          ticket_id: ticket.id,
          event_type: "received",
          description: "Appareil réceptionné à l'atelier.",
          created_by: null,
          created_at: now,
        },
        ...session.events,
      ],
    }));
    return ticket;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const shopId = requireShopId(data.shop_id);
  console.log("[workshopService] called", { hasSession: true, shopId });
  try {
    const { data: auth } = await supabase.auth.getUser();
    const ticketNumber = data.ticket_number ?? (await generateTicketNumber(shopId));
    const payload: Record<string, unknown> = {
      shop_id: shopId,
      activity_type: data.activity_type ?? "phone",
      status: "en_attente_caissier_entree",
      category: data.category,
      client_id: data.client_id ?? null,
      client_name: data.client_name,
      client_whatsapp: data.client_whatsapp,
      device_model: data.device_model,
      device_brand: data.device_brand ?? null,
      device_processor: data.device_processor ?? null,
      device_imei: data.device_imei ?? null,
      device_sn: data.device_sn ?? null,
      device_os_version: data.device_os_version ?? null,
      issues: data.issues,
      diagnosis: data.diagnosis
        ? { tools: data.diagnosis.tools, process: data.diagnosis.process }
        : null,
      notes: data.notes ?? null,
      description: data.description ?? null,
      ticket_number: ticketNumber,
      entry_fee: data.entry_fee ?? (data.activity_type === "consumable" ? null : 2000),
      entry_fee_paid: data.entry_fee_paid ?? false,
      entry_fee_method: data.entry_fee_method ?? null,
      technicien_id: data.technicien_id ?? null,
      created_by: auth.user?.id ?? null,
    };
    const { data: ticket, error } = await supabase
      .from("workshop_tickets")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    if (!ticket) throw new Error("Fiche atelier introuvable.");
    const created = ticket as WorkshopTicket;
    if (data.storage_location_id) {
      const assigned = await assignTicketToLocation(created.id, data.storage_location_id);
      if (!assigned) throw new Error("La fiche est créée, mais le casier n'a pas pu être attribué.");
    }
    if (data.entry_fee_paid) {
      const { error: paymentError } = await (supabase.from("workshop_payments" as any) as any).insert({
        shop_id: shopId,
        ticket_id: created.id,
        amount: data.entry_fee ?? 2000,
        method: data.entry_fee_method ?? "",
        payment_type: "entry",
        received_by: auth.user?.id ?? null,
      });
      if (paymentError) throw paymentError;
    }
    await addEvent(created.id, "received", "Appareil réceptionné à l'atelier.");
    return created;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}

/** Récupère les fiches d'une boutique, de la plus récente à la plus ancienne. */
export async function getTickets(
  shopId: string | null | undefined,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket[]> {
  if (isDemoMode()) return getDemoTickets(activityType);
  if (!(await hasActiveSession()) || !shopId) return [];
  const { data, error } = await supabase
    .from("workshop_tickets")
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .eq("activity_type", activityType)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkshopTicket[];
}

/** Récupère uniquement les fiches assignées à un technicien donné. */
export async function getTicketsByTechnician(
  shopId: string | null | undefined,
  technicianId: string,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket[]> {
  if (isDemoMode()) {
    return getDemoTickets(activityType).filter((ticket) => ticket.technicien_id === technicianId);
  }
  if (!(await hasActiveSession()) || !shopId) return [];
  const { data, error } = await (supabase.from("workshop_tickets" as any) as any)
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .eq("technicien_id", technicianId)
    .eq("activity_type", activityType)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkshopTicket[];
}

/** Récupère une fiche par son identifiant. */
export async function getTicketById(
  id: string,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket | null> {
  if (isDemoMode()) {
    return getDemoTickets().find(
      (ticket) => ticket.id === id && ticket.activity_type === activityType,
    ) ?? null;
  }
  if (!(await hasActiveSession())) return null;
  try {
    const { data, error } = await supabase
      .from("workshop_tickets")
      .select("*")
      .eq("id", id)
      .eq("activity_type", activityType)
      .maybeSingle();
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
export async function updateTicketStatus(
  id: string,
  status: WorkshopStatus,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket> {
  if (isDemoMode()) {
    let updated: WorkshopTicket | undefined;
    updateDemoSession((session) => ({
      ...session,
      tickets: session.tickets.map((ticket) => {
        if (ticket.id !== id || ticket.activity_type !== activityType) return ticket;
        updated = { ...ticket, status, updated_at: new Date().toISOString() };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Fiche atelier introuvable.");
    return updated;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  try {
    const { data, error } = await supabase
      .from("workshop_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("activity_type", activityType)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Fiche atelier introuvable.");
    return data as WorkshopTicket;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}

/** Met à jour les champs métier d'une fiche d'atelier. */
export async function updateWorkshopTicket(
  id: string,
  updates: WorkshopTicketUpdate,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket> {
  const updatedAt = new Date().toISOString();
  if (isDemoMode()) {
    let updated: WorkshopTicket | undefined;
    updateDemoSession((session) => ({
      ...session,
      tickets: session.tickets.map((ticket) => {
        if (ticket.id !== id || ticket.activity_type !== activityType) return ticket;
        updated = { ...ticket, ...updates, updated_at: updatedAt };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Fiche atelier introuvable.");
    return updated;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await (supabase.from("workshop_tickets") as any)
    .update({ ...updates, updated_at: updatedAt })
    .eq("id", id)
    .eq("activity_type", activityType)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Fiche atelier introuvable.");
  return data as WorkshopTicket;
}

/** Enregistre un paiement d'atelier. */
export async function createWorkshopPayment(
  shopId: string,
  ticketId: string,
  amount: number,
  method: string,
  paymentType: WorkshopPaymentRecord["payment_type"],
): Promise<WorkshopPaymentRecord> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Le montant du paiement est invalide.");
  }
  const methodCode: Record<string, string> = {
    Espèces: "cash",
    Wave: "wave",
    "Orange Money": "orange_money",
    MTN: "mtn",
    Moov: "moov",
    cash: "cash",
    wave: "wave",
    orange_money: "orange_money",
    mtn: "mtn",
    moov: "moov",
  };
  const storedMethod = methodCode[method];
  if (!storedMethod) throw new Error("Le mode de paiement sélectionné n'est pas pris en charge.");
  if (isDemoMode()) {
    const payment: WorkshopPaymentRecord = {
      id: `demo-payment-${crypto.randomUUID()}`,
      shop_id: DEMO_SHOP_ID,
      ticket_id: ticketId,
      amount,
      method: storedMethod,
      payment_type: paymentType,
      received_by: null,
      created_at: new Date().toISOString(),
    };
    updateDemoSession((session) => ({
      ...session,
      workshop_payments: [...(session.workshop_payments ?? []), payment],
    }));
    return payment;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await (supabase.from("workshop_payments" as any) as any)
    .insert({
      shop_id: requireShopId(shopId),
      ticket_id: ticketId,
      amount,
      method: storedMethod,
      payment_type: paymentType,
      received_by: auth.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Le paiement atelier n'a pas été enregistré.");
  return data as WorkshopPaymentRecord;
}

/** Récupère les paiements d'atelier effectués aujourd'hui dans la boutique. */
export async function getTodayWorkshopPayments(
  shopId: string | null | undefined,
): Promise<Array<WorkshopPaymentRecord & { ticket_number: string | null; client_name: string | null }>> {
  if (isDemoMode()) {
    const session = readDemoSession();
    if (!session) return [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return (session.workshop_payments ?? [])
      .filter((payment) => {
        const createdAt = new Date(payment.created_at).getTime();
        return createdAt >= start.getTime() && createdAt < end.getTime();
      })
      .map((payment) => {
        const ticket = session.tickets.find((item) => item.id === payment.ticket_id);
        return {
          ...payment,
          ticket_number: ticket?.ticket_number ?? null,
          client_name: ticket?.client_name ?? null,
        };
      });
  }
  if (!(await hasActiveSession()) || !shopId) return [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const { data, error } = await (supabase.from("workshop_payments" as any) as any)
    .select("id, shop_id, ticket_id, amount, method, payment_type, received_by, created_at")
    .eq("shop_id", requireShopId(shopId))
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  const payments = (data ?? []) as WorkshopPaymentRecord[];
  if (payments.length === 0) return [];
  const { data: tickets, error: ticketsError } = await (
    supabase.from("workshop_tickets" as any) as any
  )
    .select("id, ticket_number, client_name")
    .eq("shop_id", requireShopId(shopId))
    .in("id", payments.map((payment) => payment.ticket_id));
  if (ticketsError) throw ticketsError;
  const ticketRows = (tickets ?? []) as Array<{
    id: string;
    ticket_number: string | null;
    client_name: string | null;
  }>;
  const ticketById = new Map(ticketRows.map((ticket) => [ticket.id, ticket]));
  return payments.map((payment) => ({
    ...payment,
    ticket_number: ticketById.get(payment.ticket_id)?.ticket_number ?? null,
    client_name: ticketById.get(payment.ticket_id)?.client_name ?? null,
  }));
}

/** Marque une réparation comme notifiée au client par WhatsApp. */
export async function markTicketNotified(
  id: string,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket> {
  if (isDemoMode()) {
    let updated: WorkshopTicket | undefined;
    const now = new Date().toISOString();
    updateDemoSession((session) => ({
      ...session,
      tickets: session.tickets.map((ticket) => {
        if (ticket.id !== id || ticket.activity_type !== activityType) return ticket;
        updated = { ...ticket, notified_at: now, updated_at: now };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Fiche atelier introuvable.");
    return updated;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  try {
    const { data, error } = await supabase
      .from("workshop_tickets")
      .update({ notified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("activity_type", activityType)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Fiche atelier introuvable.");
    return data as WorkshopTicket;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("notified_at")) {
      const existing = await getTicketById(id, activityType);
      if (existing) return existing;
    }
    throw error;
  }
}

/** Supprime une fiche selon les politiques RLS Supabase. */
export async function deleteTicket(
  id: string,
  activityType: ActivityType = "phone",
): Promise<void> {
  if (isDemoMode()) {
    updateDemoSession((session) => ({
      ...session,
      tickets: session.tickets.filter(
        (ticket) => ticket.id !== id || ticket.activity_type !== activityType,
      ),
      events: session.events.filter((event) => event.ticket_id !== id),
    }));
    return;
  }
  if (!(await hasActiveSession())) return;
  try {
    const { error } = await supabase
      .from("workshop_tickets")
      .delete()
      .eq("id", id)
      .eq("activity_type", activityType);
    if (error) throw error;
  } catch (error) {
    console.error("[workshopService] Catch:", error);
    throw error;
  }
}

/** Recherche les appareils déjà passés à l'atelier (dédupliqués par IMEI). */
export async function searchDevices(
  shopId: string | null | undefined,
  query: string,
  activityType: ActivityType = "phone",
  clientId?: string,
): Promise<KnownDevice[]> {
  if (isDemoMode()) {
    const queryText = query.trim().toLocaleLowerCase();
    const seen = new Set<string>();
    return getDemoTickets(activityType)
      .filter((ticket) => !clientId || ticket.client_id === clientId)
      .filter((ticket) => !queryText || (ticket.device_model ?? "").toLocaleLowerCase().includes(queryText))
      .map((ticket) => ({
        device_model: ticket.device_model ?? "",
        device_imei: ticket.device_imei,
        device_sn: ticket.device_sn,
        device_processor: ticket.device_processor,
        device_os_version: ticket.device_os_version,
      }))
      .filter((device) => {
        const key = device.device_imei ?? device.device_sn ?? device.device_model;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
  if (!(await hasActiveSession()) || !shopId) return [];
  const q = query.trim().replace(/[,()%]/g, "");
  if (q.length === 1) return [];
  let request = supabase
    .from("workshop_tickets")
    .select("device_model, device_imei, device_sn, device_processor, device_os_version")
    .eq("shop_id", requireShopId(shopId))
    .eq("activity_type", activityType);
  if (clientId) request = request.eq("client_id", clientId);
  if (q.length >= 2) {
    request = request.or(
      `device_imei.ilike.%${q}%,device_sn.ilike.%${q}%,device_model.ilike.%${q}%`,
    );
  }
  const { data, error } = await request
    .order("created_at", { ascending: false })
    .limit(q ? 30 : 200);
  if (error) throw error;
  const seen = new Set<string>();
  const devices: KnownDevice[] = [];
  for (const row of (data ?? []) as KnownDevice[]) {
    const key = row.device_imei ?? row.device_sn ?? row.device_model;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    devices.push(row);
  }
  return devices;
}

/** Récupère l'historique chronologique d'une intervention. */
export async function getEvents(ticketId: string): Promise<WorkshopEvent[]> {
  if (isDemoMode()) return getDemoEvents(ticketId);
  if (!(await hasActiveSession())) return [];
  const { data, error } = await supabase
    .from("workshop_events")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkshopEvent[];
}

/** Ajoute un événement à l'historique d'une intervention. */
export async function addEvent(
  ticketId: string,
  eventType: WorkshopEventType,
  description?: string,
): Promise<WorkshopEvent> {
  if (isDemoMode()) {
    const event: WorkshopEvent = {
      id: `demo-event-${crypto.randomUUID()}`,
      ticket_id: ticketId,
      event_type: eventType,
      description: description ?? null,
      created_by: null,
      created_at: new Date().toISOString(),
    };
    updateDemoSession((session) => ({ ...session, events: [...session.events, event] }));
    return event;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("workshop_events")
    .insert({
      ticket_id: ticketId,
      event_type: eventType,
      description: description ?? null,
      created_by: auth.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WorkshopEvent;
}

/** Marque les frais de diagnostic comme payés. */
export async function markEntryFeePaid(
  id: string,
  activityType: ActivityType = "phone",
): Promise<WorkshopTicket> {
  if (isDemoMode()) {
    let updated: WorkshopTicket | undefined;
    updateDemoSession((session) => ({
      ...session,
      tickets: session.tickets.map((ticket) => {
        if (ticket.id !== id || ticket.activity_type !== activityType) return ticket;
        updated = { ...ticket, entry_fee_paid: true, updated_at: new Date().toISOString() };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Fiche atelier introuvable.");
    return updated;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("workshop_tickets")
    .update({ entry_fee_paid: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("activity_type", activityType)
    .select()
    .single();
  if (error) throw error;
  return data as WorkshopTicket;
}
