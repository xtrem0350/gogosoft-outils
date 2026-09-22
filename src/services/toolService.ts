import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import type { LogAction, Tool, ToolInsert, ToolUpdate } from "@/types/database";

/** Filtres appliqués à la liste des outils. */
export interface ToolFilters {
  /** Boutique courante : obligatoire pour obtenir des résultats. */
  shopId?: string | null;
  search?: string;
  categorie?: string;
  type?: string;
  favoriOnly?: boolean;
  /** `false` (défaut) = outils actifs, `true` = corbeille. */
  deleted?: boolean;
}

/**
 * Enregistre une entrée dans le journal des modifications.
 * Échoue silencieusement : le journal ne doit jamais bloquer une action.
 */
async function writeLog(toolId: string, action: LogAction, changes: unknown): Promise<void> {
  if (!(await hasActiveSession())) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("tool_logs").insert({
    tool_id: toolId,
    user_id: data.user.id,
    action,
    changes: (changes ?? null) as never,
  });
}

/**
 * Liste les outils correspondant aux filtres, triés par favoris puis par nom.
 */
export async function listTools(filters: ToolFilters = {}): Promise<Tool[]> {
  if (!(await hasActiveSession()) || !filters.shopId) return [];
  let query = supabase.from("tools").select("*").eq("shop_id", filters.shopId);

  query = filters.deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (filters.categorie && filters.categorie !== "all") {
    query = query.eq("categorie", filters.categorie);
  }
  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.favoriOnly) {
    query = query.eq("favori", true);
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `nom.ilike.${term},version.ilike.${term},chemin.ilike.${term},description.ilike.${term}`,
    );
  }

  const { data, error } = await query
    .order("favori", { ascending: false })
    .order("nom", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Récupère un outil par son identifiant. */
export async function getTool(id: string): Promise<Tool | null> {
  if (!(await hasActiveSession())) return null;
  const { data, error } = await supabase.from("tools").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Crée un outil et journalise la création. */
export async function createTool(values: Omit<ToolInsert, "created_by">): Promise<Tool> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("tools")
    .insert({ ...values, created_by: auth.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  await writeLog(data.id, "create", values);
  return data;
}

/** Met à jour un outil et journalise la modification. */
export async function updateTool(id: string, values: ToolUpdate): Promise<Tool> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("tools")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await writeLog(id, "update", values);
  return data;
}

/** Bascule l'état favori d'un outil. */
export async function toggleFavori(tool: Tool): Promise<Tool> {
  return updateTool(tool.id, { favori: !tool.favori });
}

/** Suppression douce : l'outil part à la corbeille et reste restaurable. */
export async function softDeleteTool(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  const { error } = await supabase
    .from("tools")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await writeLog(id, "delete", { deleted_at: new Date().toISOString() });
}

/** Restaure un outil depuis la corbeille. */
export async function restoreTool(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  const { error } = await supabase.from("tools").update({ deleted_at: null }).eq("id", id);
  if (error) throw error;
  await writeLog(id, "restore", null);
}

/** Suppression définitive (réservée aux administrateurs par les règles d'accès). */
export async function hardDeleteTool(id: string): Promise<void> {
  if (!(await hasActiveSession())) return;
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) throw error;
}

/** Duplique un outil existant (suffixe « (copie) »). */
export async function duplicateTool(tool: Tool): Promise<Tool> {
  return createTool({
    shop_id: tool.shop_id,
    nom: `${tool.nom} (copie)`,
    version: tool.version,
    chemin: tool.chemin,
    type: tool.type,
    categorie: tool.categorie,
    sous_categorie: tool.sous_categorie,
    description: tool.description,
    favori: false,
    icone: tool.icone,
    tags: tool.tags,
  });
}

/** Insère en lot des outils (import du catalogue de démonstration). */
export async function bulkInsertTools(values: Omit<ToolInsert, "created_by">[]): Promise<number> {
  if (!(await hasActiveSession())) return 0;
  const { data: auth } = await supabase.auth.getUser();
  const rows = values.map((v) => ({ ...v, created_by: auth.user?.id ?? null }));
  const { data, error } = await supabase.from("tools").insert(rows).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
