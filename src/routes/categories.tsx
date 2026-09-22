import { createFileRoute } from "@tanstack/react-router";
import { CircuitBoard, Cpu, HardDrive, Package, Smartphone, Wrench } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useTools } from "@/hooks/useTools";
import { CATEGORIES, type Categorie } from "@/types/database";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

const categoryPresentation: Record<Categorie, { icon: typeof Cpu; color: string }> = {
  MTK: { icon: Cpu, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  Unisoc: { icon: CircuitBoard, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  Apple: { icon: Smartphone, color: "bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300" },
  Drivers: { icon: HardDrive, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  Autres: { icon: Package, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
};

function CategoriesPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { data: tools = [], isLoading, error } = useTools({ shopId });

  if (shopLoading || isLoading) {
    return <div className="mx-auto max-w-6xl space-y-6"><p className="text-sm text-muted-foreground">Chargement des catégories...</p></div>;
  }

  if (!shopId) {
    return <div className="mx-auto max-w-6xl"><EmptyState icon={Wrench} title="Aucune boutique sélectionnée" description="Créez ou sélectionnez une boutique pour consulter ses catégories d'outils." />;</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-6xl rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error instanceof Error ? error.message : "Impossible de charger les catégories."}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Organisation</p>
        <h1 className="mt-2 text-3xl font-bold">Catégories</h1>
        <p className="mt-2 text-muted-foreground">Explorez le catalogue de cette boutique par famille d'outils.</p>
      </div>

      {tools.length === 0 ? <EmptyState icon={Package} title="Aucun outil à classer" description="Ajoutez un outil pour commencer à organiser votre catalogue." actionLabel="Voir les outils" onAction={() => window.location.assign("/outils")} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => {
          const { icon: Icon, color } = categoryPresentation[category];
          const count = tools.filter((tool) => tool.categorie === category).length;
          return (
            <Card key={category} className="card-elevated border-0">
              <CardHeader>
                <div className={`flex size-12 items-center justify-center rounded-full ${color}`}><Icon className="size-6" /></div>
                <CardTitle className="mt-3">{category}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{count} outil{count > 1 ? "s" : ""}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.assign(`/outils?categorie=${encodeURIComponent(category)}`)}>Voir les outils</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
