import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wrench } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getTickets } from "@/services/workshopService";
import type { WorkshopStatus, WorkshopTicket } from "@/types/database";

export const Route = createFileRoute("/atelier/")({
  beforeLoad: () => {
    throw redirect({ href: "/phone/atelier", statusCode: 301 });
  },
  head: () => ({
    meta: [
      { title: "Atelier — GogoSoft Tools Manager" },
      {
        name: "description",
        content: "Suivez les fiches de réparation de votre atelier et leur diagnostic.",
      },
      { property: "og:title", content: "Atelier — GogoSoft Tools Manager" },
      {
        property: "og:description",
        content: "Suivi des réparations en cours, terminées et livrées.",
      },
    ],
  }),
  component: WorkshopListPage,
});

type Filter = "tous" | WorkshopStatus;

const STATUS_LABEL: Record<WorkshopStatus, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
};

const STATUS_CLASS: Record<WorkshopStatus, string> = {
  en_attente: "bg-muted text-muted-foreground",
  en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  termine: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  livre: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
};

/** Liste filtrable des fiches de l'atelier de la boutique courante. */
function WorkshopListPage() {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [filter, setFilter] = useState<Filter>("tous");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await getTickets(shopId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les fiches.");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopLoading) return;
    void load();
  }, [load, shopLoading]);

  const periodTickets = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    return tickets.filter((ticket) => {
      if (!ticket.created_at) return false;
      const createdAt = new Date(ticket.created_at).getTime();
      return createdAt >= start && createdAt <= end;
    });
  }, [endDate, startDate, tickets]);

  const statusCounts = useMemo(
    () =>
      periodTickets.reduce<Record<WorkshopStatus, number>>(
        (counts, ticket) => ({ ...counts, [ticket.status]: counts[ticket.status] + 1 }),
        { en_attente: 0, en_cours: 0, termine: 0, livre: 0 },
      ),
    [periodTickets],
  );

  const filtered = filter === "tous" ? periodTickets : periodTickets.filter((ticket) => ticket.status === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Suivi</p>
          <h1 className="mt-2 text-3xl font-bold">Atelier</h1>
          <p className="mt-2 text-muted-foreground">Les réparations en cours et leur diagnostic.</p>
        </div>
        <Button asChild>
          <Link to="/atelier/nouveau">
            <Plus />
            Nouvelle fiche
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label htmlFor="workshop-start-date" className="text-sm font-semibold text-foreground">
              Période du
            </label>
            <input
              id="workshop-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="workshop-end-date" className="text-sm font-semibold text-foreground">
              au
            </label>
            <input
              id="workshop-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <p className="pb-2 text-sm text-muted-foreground">
            {periodTickets.length} fiche(s) sur la période sélectionnée
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="tous">Tout ({periodTickets.length})</TabsTrigger>
          <TabsTrigger value="en_attente">En attente ({statusCounts.en_attente})</TabsTrigger>
          <TabsTrigger value="en_cours">En cours ({statusCounts.en_cours})</TabsTrigger>
          <TabsTrigger value="termine">Terminé ({statusCounts.termine})</TabsTrigger>
          <TabsTrigger value="livre">Livré ({statusCounts.livre})</TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : null}

      {shopLoading || loading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}

      {!loading && !shopLoading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={filter === "tous" ? "Aucune fiche d'atelier" : "Aucune fiche pour ce filtre"}
          description="Créez une fiche pour enregistrer un appareil, ses pannes et son diagnostic."
          actionLabel="Nouvelle fiche"
          onAction={() => void navigate({ to: "/atelier/nouveau" })}
        />
      ) : null}

      <div className="grid gap-4">
        {filtered.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-semibold">{ticket.client_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {ticket.device_model} · {ticket.client_whatsapp}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={STATUS_CLASS[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link to="/atelier/$id" params={{ id: ticket.id }}>
                    Voir le diagnostic
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
