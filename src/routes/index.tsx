import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  UserPlus,
  UserRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useSubscription } from "@/hooks/useSubscription";
import { getClientsByShop, type ClientRecord } from "@/services/clientService";
import { getEvents, getTickets, type WorkshopEvent } from "@/services/workshopService";
import type { WorkshopTicket } from "@/types/database";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — GogoSoft Tools Manager" },
      {
        name: "description",
        content:
          "Vue d'ensemble de votre atelier de réparation : réparations en cours, clients et abonnement.",
      },
      { property: "og:title", content: "Tableau de bord — GogoSoft Tools Manager" },
      {
        property: "og:description",
        content: "Vue d'ensemble de votre atelier de réparation mobile.",
      },
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
  const { profile, user } = useAuth();
  const { shop, shopId, loading: shopLoading } = useCurrentShop();
  const { subscription, daysRemaining, loading: subLoading } = useSubscription();

  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [events, setEvents] = useState<WorkshopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId) {
      setTickets([]);
      setClients([]);
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ticketList, clientList] = await Promise.all([
        getTickets(shopId),
        getClientsByShop(shopId),
      ]);
      const eventLists = await Promise.all(
        ticketList.slice(0, 5).map((ticket) => getEvents(ticket.id)),
      );
      setTickets(ticketList);
      setClients(clientList);
      setEvents(
        eventLists
          .flat()
          .sort((left, right) => (right.created_at ?? "").localeCompare(left.created_at ?? ""))
          .slice(0, 5),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger les données de la boutique.",
      );
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
  const displayName =
    profile?.nom?.trim() ||
    (user?.user_metadata["full_name"] as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Réparateur";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const currentHour = new Date().getHours();
  const greeting =
    currentHour >= 18 || currentHour < 6 ? `Bonsoir ${firstName}` : `Bonjour ${firstName}`;
  const roleLabel = profile?.role ?? "Réparateur";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = tickets
    .filter((ticket) => ticket.created_at?.startsWith(currentMonth))
    .reduce((total, ticket) => total + (ticket.price_final ?? ticket.price_estimate ?? 0), 0);
  const formatAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div
        className="bg-hero-ivoirien relative overflow-hidden rounded-2xl p-6 shadow-3d sm:p-8"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&auto=format&fit=crop)",
        }}
      >
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{greeting} 👋</h1>
            <p className="mt-3 text-sm text-slate-700">Que voulez-vous faire aujourd'hui ?</p>
            <p className="mt-2 text-sm text-slate-700/80">
              {roleLabel} · {shop?.name ?? "Votre atelier"}
            </p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize text-white">
            {roleLabel}
          </span>
        </div>
      </div>

      {showRenewalBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
          Votre abonnement expire dans {daysRemaining} jour(s).{" "}
          <Link to="/abonnement" className="font-semibold underline">
            Renouveler
          </Link>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/atelier/nouveau" className="group">
          <Card className="card-3d h-full">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                <Wrench />
              </div>
              <div>
                <p className="font-semibold">Nouvelle réparation</p>
                <p className="text-sm text-muted-foreground">Créer une fiche atelier</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/clients/nouveau" className="group">
          <Card className="h-full transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                <UserPlus />
              </div>
              <div>
                <p className="font-semibold">Ajouter un client</p>
                <p className="text-sm text-muted-foreground">Enregistrer un nouveau client</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/statistiques" className="group">
          <Card className="h-full transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <Activity />
              </div>
              <div>
                <p className="font-semibold">Voir mes statistiques</p>
                <p className="text-sm text-muted-foreground">Analyser votre activité</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Réparations en cours"
          value={busy ? "…" : enCours}
          icon={Activity}
          trend={`${tickets.length} fiche(s) au total`}
          color="success"
        />
        <StatsCard
          title="Clients enregistrés"
          value={busy ? "…" : clients.length}
          icon={UserRound}
          trend="Base de la boutique"
          color="primary"
        />
        <StatsCard
          title="CA du mois"
          value={busy ? "…" : formatAmount.format(monthlyRevenue)}
          icon={CreditCard}
          trend="Selon les montants des fiches"
          color="warning"
        />
        <StatsCard
          title="Jours restants abonnement"
          value={subLoading ? "…" : daysRemaining}
          icon={ClipboardList}
          trend={subscription?.plan ? `Formule ${subscription.plan}` : "Aucun abonnement"}
          color="danger"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="card-elevated border-0 transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Les dernières actions sur vos fiches.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.description ?? event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString("fr-FR")
                        : "Date inconnue"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="card-elevated border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Réparations récentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Les 5 dernières fiches de l'atelier.
              </p>
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
                  <span className="text-xs text-muted-foreground">
                    {STATUS_LABELS[repair.status] ?? repair.status}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Clients récents</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Les derniers clients enregistrés.
              </p>
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
                  <span className="text-xs text-muted-foreground">
                    {client.total_repairs ?? 0} réparation(s)
                  </span>
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
