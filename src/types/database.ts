import type { Database } from "@/integrations/supabase/types";

/** Type d'un outil sur le disque. */
export type ToolType = "exe" | "archive" | "dossier";

/** Catégorie métier d'un outil. */
export type Categorie = "MTK" | "Unisoc" | "Apple" | "Drivers" | "Autres";

/** Action tracée lors de l'utilisation d'un outil. */
export type LaunchAction = "open_folder" | "launch_exe" | "open_archive";

/** Action tracée dans le journal des modifications. */
export type LogAction = "create" | "update" | "delete" | "restore";

/** Rôle applicatif d'un utilisateur. */
export type AppRole = "admin" | "technicien" | "lecteur";

export type Tool = Database["public"]["Tables"]["tools"]["Row"];
export type ToolInsert = Database["public"]["Tables"]["tools"]["Insert"];
export type ToolUpdate = Database["public"]["Tables"]["tools"]["Update"];
export type ToolLaunch = Database["public"]["Tables"]["tool_launches"]["Row"];
export type ToolLog = Database["public"]["Tables"]["tool_logs"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  avatar_url?: string | null;
  phone_country_code?: string | null;
  phone?: string | null;
  role?: AppRole | null;
};
export type WorkshopStatus = "en_attente" | "en_cours" | "termine" | "livre";
export type WorkshopTicket = {
  id: string;
  shop_id: string | null;
  client_id: string | null;
  client_name: string | null;
  client_whatsapp: string | null;
  device_model: string | null;
  device_processor: string | null;
  device_imei: string | null;
  device_sn: string | null;
  device_os_version: string | null;
  issues: string[];
  status: WorkshopStatus;
  diagnosis: Record<string, unknown> | null;
  notes: string | null;
  price_estimate: number | null;
  price_final: number | null;
  notified_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** Liste ordonnée des catégories utilisées dans l'UI. */
export const CATEGORIES: Categorie[] = ["MTK", "Unisoc", "Apple", "Drivers", "Autres"];

/** Liste des types d'outils. */
export const TOOL_TYPES: ToolType[] = ["exe", "archive", "dossier"];

/** Libellés lisibles pour les actions de lancement. */
export const LAUNCH_ACTION_LABELS: Record<LaunchAction, string> = {
  open_folder: "Ouverture du dossier",
  launch_exe: "Lancement de l'exécutable",
  open_archive: "Ouverture de l'archive",
};

/** Libellés lisibles pour le journal des modifications. */
export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  restore: "Restauration",
};
