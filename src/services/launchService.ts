import { supabase } from "@/integrations/supabase/client";
import { getAgentUrl } from "@/lib/localAgent";
import { hasActiveSession } from "@/lib/supabaseGuard";
import type { LaunchAction, Tool } from "@/types/database";

/** Résultat d'une demande de lancement. */
export interface LaunchResult {
  ok: boolean;
  message: string;
}

/**
 * Appelle l'agent local Windows.
 * `POST /open`   → ouvre le dossier dans l'Explorateur.
 * `POST /launch` → lance l'exécutable ou ouvre l'archive.
 */
async function callAgent(endpoint: "open" | "launch", chemin: string): Promise<LaunchResult> {
  try {
    const res = await fetch(`${getAgentUrl()}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: chemin }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: text || `L'agent local a renvoyé une erreur (${res.status}).` };
    }
    return { ok: true, message: "Commande envoyée à votre PC." };
  } catch {
    return {
      ok: false,
      message:
        "Agent local injoignable. Démarrez-le sur votre PC (voir Paramètres) puis réessayez.",
    };
  }
}

/** Enregistre le lancement : historique + compteur + date de dernière utilisation. */
export async function registerLaunch(toolId: string, action: LaunchAction): Promise<void> {
  if (!(await hasActiveSession())) return;
  console.log("[launchService] called", { hasSession: true, shopId: null });
  const { error } = await supabase.rpc("register_launch", {
    _tool_id: toolId,
    _action: action,
  });
  if (error) throw error;
}

/** Ouvre le dossier contenant l'outil dans l'Explorateur Windows. */
export async function openFolder(tool: Tool): Promise<LaunchResult> {
  const result = await callAgent("open", tool.chemin);
  if (result.ok) await registerLaunch(tool.id, "open_folder");
  return result;
}

/** Lance l'exécutable de l'outil. */
export async function launchExe(tool: Tool): Promise<LaunchResult> {
  const result = await callAgent("launch", tool.chemin);
  if (result.ok) await registerLaunch(tool.id, "launch_exe");
  return result;
}

/** Ouvre l'archive avec l'application associée (WinRAR / 7-Zip). */
export async function openArchive(tool: Tool): Promise<LaunchResult> {
  const result = await callAgent("launch", tool.chemin);
  if (result.ok) await registerLaunch(tool.id, "open_archive");
  return result;
}
