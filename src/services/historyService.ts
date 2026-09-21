import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import type { LaunchAction, LogAction } from "@/types/database";

/** Entrée d'historique enrichie du nom de l'outil. */
export interface LaunchEntry {
  id: string;
  tool_id: string | null;
  user_id: string | null;
  action: LaunchAction;
  launched_at: string;
  tools: { nom: string; categorie: string } | null;
}

/** Entrée du journal des modifications enrichie du nom de l'outil. */
export interface LogEntry {
  id: string;
  tool_id: string | null;
  user_id: string | null;
  action: LogAction;
  changes: unknown;
  logged_at: string;
  tools: { nom: string } | null;
}

/** Filtres de l'historique des lancements. */
export interface HistoryFilters {
  toolId?: string;
  action?: string;
  /** Date ISO (début de période). */
  since?: string;
  limit?: number;
}

/** Liste les lancements (les règles d'accès limitent aux siens, sauf admin). */
export async function listLaunches(filters: HistoryFilters = {}): Promise<LaunchEntry[]> {
  const hasSession = await hasActiveSession();
  console.log("[historyService] called", { hasSession, shopId: null });
  if (!hasSession) return [];
  let query = supabase
    .from("tool_launches")
    .select("id, tool_id, user_id, action, launched_at, tools(nom, categorie)")
    .order("launched_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.toolId && filters.toolId !== "all") query = query.eq("tool_id", filters.toolId);
  if (filters.action && filters.action !== "all") query = query.eq("action", filters.action);
  if (filters.since) query = query.gte("launched_at", filters.since);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as LaunchEntry[];
}

/** Liste le journal des créations / modifications / suppressions. */
export async function listLogs(limit = 200): Promise<LogEntry[]> {
  if (!(await hasActiveSession())) return [];
  const { data, error } = await supabase
    .from("tool_logs")
    .select("id, tool_id, user_id, action, changes, logged_at, tools(nom)")
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as LogEntry[];
}
