import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllModules, type AdminModule } from "@/services/adminService";

export const Route = createFileRoute("/admin/modules/")({ component: AdminModulesPage });

function AdminModulesPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (state) => state.location.search as { type?: string } });
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAllModules()
      .then((rows) =>
        setModules(
          search.type === "free" ? rows.filter((row) => row.subscriber_count === 0) : rows,
        ),
      )
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, [search.type]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Modules disponibles"
        subtitle="Catalogue de fonctionnalités et adoption par les abonnés"
        icon={Package}
        action={
          <Button onClick={() => void navigate({ to: "/admin/modules/nouveau" as any })}>
            <Plus /> Créer un module
          </Button>
        }
      />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.code}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{module.label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{module.code}</p>
                </div>
                <Package className="size-5 text-orange-600" />
              </div>
              <p className="min-h-10 text-sm text-muted-foreground">
                {module.description || "Aucune description."}
              </p>
              <div className="border-t pt-3 text-sm">
                <span className="font-semibold">{module.subscriber_count}</span> atelier(s)
                utilisateur(s)
              </div>
            </CardContent>
          </Card>
        ))}
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun module pour ce filtre.</p>
        ) : null}
      </div>
    </div>
  );
}
