import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import type { Categorie, Tool } from "@/types/database";

/** Indicateurs affichés sur le tableau de bord et la page statistiques. */
export interface ToolStats {
  total: number;
  favoris: number;
  parCategorie: { categorie: Categorie; count: number }[];
  parType: { type: string; count: number }[];
  lancementsAujourdhui: number;
  lancements7j: number;
  top: Tool[];
  recents: Tool[];
}

const EMPTY_STATS: ToolStats = {
  total: 0,
  favoris: 0,
  parCategorie: [],
  parType: [],
  lancementsAujourdhui: 0,
  lancements7j: 0,
  top: [],
  recents: [],
};

/** Calcule les statistiques du catalogue et de l'utilisation pour une boutique. */
export function useStats(shopId: string | null | undefined) {
  return useQuery({
    queryKey: ["stats", shopId],
    enabled: Boolean(shopId),
    queryFn: async (): Promise<ToolStats> => {
      if (!(await hasActiveSession()) || !shopId) return EMPTY_STATS;

      const { data: tools, error } = await supabase
        .from("tools")
        .select("*")
        .eq("shop_id", shopId)
        .is("deleted_at", null);
      if (error) throw error;

      const list = tools ?? [];
      const toolIds = list.map((tool) => tool.id);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

      let todayCount = 0;
      let weekCount = 0;

      if (toolIds.length > 0) {
        const [today, week] = await Promise.all([
          supabase
            .from("tool_launches")
            .select("*", { count: "exact", head: true })
            .in("tool_id", toolIds)
            .gte("launched_at", startOfDay.toISOString()),
          supabase
            .from("tool_launches")
            .select("*", { count: "exact", head: true })
            .in("tool_id", toolIds)
            .gte("launched_at", weekAgo.toISOString()),
        ]);
        if (today.error) throw today.error;
        if (week.error) throw week.error;
        todayCount = today.count ?? 0;
        weekCount = week.count ?? 0;
      }

      const countBy = <T extends string>(key: (tool: Tool) => T) =>
        list.reduce<Record<string, number>>((acc, tool) => {
          const k = key(tool);
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {});

      const byCat = countBy((tool) => tool.categorie as Categorie);
      const byType = countBy((tool) => tool.type);

      return {
        total: list.length,
        favoris: list.filter((tool) => tool.favori).length,
        parCategorie: (Object.keys(byCat) as Categorie[]).map((c) => ({
          categorie: c,
          count: byCat[c] ?? 0,
        })),
        parType: Object.keys(byType).map((t) => ({ type: t, count: byType[t] ?? 0 })),
        lancementsAujourdhui: todayCount,
        lancements7j: weekCount,
        top: [...list].sort((a, b) => b.launch_count - a.launch_count).slice(0, 5),
        recents: [...list]
          .filter((tool) => tool.last_used_at)
          .sort((a, b) => (b.last_used_at ?? "").localeCompare(a.last_used_at ?? ""))
          .slice(0, 5),
      };
    },
  });
}
