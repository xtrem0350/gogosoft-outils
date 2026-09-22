import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Rocket, Star, Wrench } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useStats } from "@/hooks/useStats";

export const Route = createFileRoute("/statistiques")({
  head: () => ({
    meta: [
      { title: "Statistiques — GogoSoft Tools Manager" },
      {
        name: "description",
        content: "Indicateurs d'utilisation du catalogue d'outils de votre atelier.",
      },
      { property: "og:title", content: "Statistiques — GogoSoft Tools Manager" },
      {
        property: "og:description",
        content: "Outils les plus utilisés, répartition par catégorie et lancements récents.",
      },
    ],
  }),
  component: StatistiquesPage,
});

/** Indicateurs d'usage du catalogue pour la boutique courante. */
function StatistiquesPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { data, isLoading, error } = useStats(shopId);

  const busy = shopLoading || isLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Analyse</p>
        <h1 className="mt-2 text-3xl font-bold">Statistiques</h1>
        <p className="mt-2 text-muted-foreground">L'utilisation réelle de vos outils.</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">Impossible de calculer les statistiques.</p>
      ) : null}
      {!shopLoading && !shopId ? (
        <EmptyState
          icon={BarChart3}
          title="Aucune boutique sélectionnée"
          description="Sélectionnez une boutique pour consulter ses statistiques."
        />
      ) : null}

      {shopId ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Outils actifs"
              value={busy ? "…" : (data?.total ?? 0)}
              icon={Wrench}
              color="primary"
            />
            <StatsCard
              title="Favoris"
              value={busy ? "…" : (data?.favoris ?? 0)}
              icon={Star}
              color="warning"
            />
            <StatsCard
              title="Lancements aujourd'hui"
              value={busy ? "…" : (data?.lancementsAujourdhui ?? 0)}
              icon={Rocket}
              color="success"
            />
            <StatsCard
              title="Lancements 7 jours"
              value={busy ? "…" : (data?.lancements7j ?? 0)}
              icon={BarChart3}
              color="danger"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-elevated border-0">
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.parCategorie ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun outil enregistré.</p>
                ) : (
                  data?.parCategorie.map((row) => (
                    <div key={row.categorie} className="flex items-center justify-between text-sm">
                      <span>{row.categorie}</span>
                      <span className="font-semibold">{row.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated border-0">
              <CardHeader>
                <CardTitle>Outils les plus utilisés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.top ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun lancement enregistré.</p>
                ) : (
                  data?.top.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{tool.nom}</span>
                      <span className="font-semibold">{tool.launch_count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
