import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowUpRight, ClipboardList, Plus, UserRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useSubscription } from "@/hooks/useSubscription";
import { getClientsByShop, type ClientRecord } from "@/services/clientService";
import { getTickets } from "@/services/workshopService";
import type { WorkshopTicket } from "@/types/database";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — GogoSoft Tools Manager" },
      { name: "description", content: "Vue d'ensemble de votre atelier de réparation : réparations en cours, clients et abonnement." },
      { property: "og:title", content: "Tableau de bord — GogoSoft Tools Manager" },
      { property: "og:description", content: "Vue d'ensemble de votre atelier de réparation mobile." },
    ],
  }),
  component: Index,
});

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
};

function Index() {
  const navigate = useNavigate();
  const { shop, shopId, loading: shopLoading } = useCurrentShop();
  const { subscription, daysRemaining, loading: subLoading } = useSubscription();

  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) {
      setTickets([]);
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ticketList, clientList] = await Promise.all([getTickets(shopId), getClientsByShop(shopId)]);
      setTickets(ticketList);
      setClients(clientList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les données de la boutique.");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopLoading) return;
    void load();
  }, [load, shopLoading]);

  const enCours = tickets.filter((ticket) => ticket.status === "en_cours").length;
  const showRenewalBanner = !subLoading && daysRemaining > 0 && daysRemaining <= 3;
  const busy = shopLoading || loading;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-900 bg-cover bg-center p-6 text-white sm:p-8"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=1600&auto=format&fit=crop)" }}
      >
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-300">Vue d'ensemble</p>
            <h1 className="text-3xl font-bold tracking-tight">{shop?.name ?? "Votre atelier"}</h1>
            <p className="mt-2 text-sm text-slate-200">Votre atelier de réparation, résumé en un coup d'œil.</p>
          </div>
          <Button asChild className="accent-gradient text-accent-foreground">
            <Link to="/atelier/nouveau">
              <Plus />
              Nouvelle réparation
            </Link>
          </Button>
        </div>
      </div>

      {showRenewalBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
          Votre abonnement expire dans {daysRemaining} jour(s).{" "}
          <Link to="/abonnement" className="font-semibold underline">Renouveler</Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Réparations en cours" value={busy ? "…" : enCours} icon={Activity} trend={`${tickets.length} fiche(s) au total`} color="success" />
        <StatsCard title="Clients enregistrés" value={busy ? "…" : clients.length} icon={UserRound} trend="Base de la boutique" color="primary" />
        <StatsCard title="Fiches terminées" value={busy ? "…" : tickets.filter((t) => t.status === "termine" || t.status === "livre").length} icon={Wrench} trend="Prêtes ou livrées" color="warning" />
        <StatsCard
          title="Jours restants abonnement"
          value={subLoading ? "…" : daysRemaining}
          icon={ClipboardList}
          trend={subscription?.plan ? `Formule ${subscription.plan}` : "Aucun abonnement"}
          color="danger"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="card-elevated border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Réparations récentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Les 5 dernières fiches de l'atelier.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/atelier">
                Voir tout
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Aucune réparation"
                description="Créez votre première fiche d'atelier pour suivre une réparation."
                actionLabel="Nouvelle fiche"
                onAction={() => void navigate({ to: "/atelier/nouveau" })}
              />
            ) : (
              tickets.slice(0, 5).map((repair) => (
                <Link
                  key={repair.id}
                  to="/atelier/$id"
                  params={{ id: repair.id }}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-semibold">{repair.client_name}</p>
                    <p className="text-xs text-muted-foreground">{repair.device_model}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[repair.status] ?? repair.status}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Clients récents</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Les derniers clients enregistrés.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clients">
                Voir tout
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : clients.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="Aucun client"
                description="Enregistrez vos clients pour retrouver leur historique de réparations."
                actionLabel="Nouveau client"
                onAction={() => void navigate({ to: "/clients/nouveau" })}
              />
            ) : (
              clients.slice(0, 5).map((client) => (
                <Link
                  key={client.id}
                  to="/clients/$id"
                  params={{ id: client.id }}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{client.full_name}</p>
                    <p className="text-xs text-muted-foreground">{client.whatsapp}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{client.total_repairs ?? 0} réparation(s)</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/atelier/nouveau">Nouvelle réparation</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/clients/nouveau">Nouveau client</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/outils">Catalogue d'outils</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/abonnement">Voir l'abonnement</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
