import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
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

/** Calcule les statistiques du catalogue et de l'utilisation. */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<ToolStats> => {
      const { data: tools, error } = await supabase
        .from("tools")
        .select("*")
        .is("deleted_at", null);
      if (error) throw error;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

      const [{ count: todayCount }, { count: weekCount }] = await Promise.all([
        supabase
          .from("tool_launches")
          .select("*", { count: "exact", head: true })
          .gte("launched_at", startOfDay.toISOString()),
        supabase
          .from("tool_launches")
          .select("*", { count: "exact", head: true })
          .gte("launched_at", weekAgo.toISOString()),
      ]);

      const list = tools ?? [];
      const countBy = <T extends string>(key: (t: Tool) => T) =>
        list.reduce<Record<string, number>>((acc, t) => {
          const k = key(t);
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {});

      const byCat = countBy((t) => t.categorie as Categorie);
      const byType = countBy((t) => t.type);

      return {
        total: list.length,
        favoris: list.filter((t) => t.favori).length,
        parCategorie: (Object.keys(byCat) as Categorie[]).map((c) => ({
          categorie: c,
          count: byCat[c] ?? 0,
        })),
        parType: Object.keys(byType).map((t) => ({ type: t, count: byType[t] ?? 0 })),
        lancementsAujourdhui: todayCount ?? 0,
        lancements7j: weekCount ?? 0,
        top: [...list].sort((a, b) => b.launch_count - a.launch_count).slice(0, 5),
        recents: [...list]
          .filter((t) => t.last_used_at)
          .sort((a, b) => (b.last_used_at ?? "").localeCompare(a.last_used_at ?? ""))
          .slice(0, 5),
      };
    },
  });
}
