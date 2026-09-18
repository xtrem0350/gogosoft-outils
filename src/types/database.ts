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
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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
