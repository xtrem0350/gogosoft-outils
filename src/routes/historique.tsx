import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, ScrollText } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listLaunches, listLogs } from "@/services/historyService";
import {
  LAUNCH_ACTION_LABELS,
  LOG_ACTION_LABELS,
  type LaunchAction,
  type LogAction,
} from "@/types/database";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique — GogoSoft Tools Manager" },
      {
        name: "description",
        content: "Historique des lancements d'outils et journal des modifications du catalogue.",
      },
      { property: "og:title", content: "Historique — GogoSoft Tools Manager" },
      { property: "og:description", content: "Traçabilité complète des actions de votre atelier." },
    ],
  }),
  component: HistoriquePage,
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

/** Historique des lancements et journal des modifications. */
function HistoriquePage() {
  const launches = useQuery({
    queryKey: ["launches"],
    queryFn: () => listLaunches({ limit: 100 }),
  });
  const logs = useQuery({ queryKey: ["logs"], queryFn: () => listLogs(100) });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Traçabilité</p>
        <h1 className="mt-2 text-3xl font-bold">Historique</h1>
        <p className="mt-2 text-muted-foreground">
          Qui a lancé quoi, et quand le catalogue a changé.
        </p>
      </div>

      <Tabs defaultValue="launches">
        <TabsList>
          <TabsTrigger value="launches">Lancements</TabsTrigger>
          <TabsTrigger value="logs">Modifications</TabsTrigger>
        </TabsList>

        <TabsContent value="launches" className="mt-4">
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle>Lancements d'outils</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {launches.isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : null}
              {launches.error ? (
                <p className="text-sm text-destructive">
                  Impossible de charger l'historique des lancements.
                </p>
              ) : null}
              {!launches.isLoading && !launches.error && (launches.data ?? []).length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Aucun lancement"
                  description="L'historique se remplira dès que vous ouvrirez ou lancerez un outil."
                />
              ) : null}
              {(launches.data ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.tools?.nom ?? "Outil supprimé"}</p>
                    <p className="text-xs text-muted-foreground">
                      {LAUNCH_ACTION_LABELS[entry.action as LaunchAction] ?? entry.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.launched_at)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle>Journal des modifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
              {logs.error ? (
                <p className="text-sm text-destructive">Impossible de charger le journal.</p>
              ) : null}
              {!logs.isLoading && !logs.error && (logs.data ?? []).length === 0 ? (
                <EmptyState
                  icon={ScrollText}
                  title="Aucune modification"
                  description="Les créations, modifications et suppressions d'outils apparaîtront ici."
                />
              ) : null}
              {(logs.data ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.tools?.nom ?? "Outil supprimé"}</p>
                    <p className="text-xs text-muted-foreground">
                      {LOG_ACTION_LABELS[entry.action as LogAction] ?? entry.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.logged_at)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
