import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  Laptop,
  Smartphone,
  ShoppingCart,
  UserPlus,
  UserRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { IconBadge3D } from "@/components/IconBadge3D";
import { PricingModal } from "@/components/PricingModal";
import { StatsCard } from "@/components/StatsCard";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
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
  en_attente: "⏳ En attente",
  en_cours: "⚙️ En cours",
  termine: "✅ Terminé",
  livre: "📦 Livré",
};

function formatRelativeTime(value: string | null) {
  if (!value) return "Date inconnue";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function Index() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading } = useAuth();
  const { shop, shopId, loading: shopLoading } = useCurrentShop();
  const { subscription, daysRemaining, loading: subLoading } = useSubscription();
  const [pricingOpen, setPricingOpen] = useState(false);

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

  const subscriptionExpired = Boolean(
    subscription &&
    (subscription.status === "expired" ||
      (subscription.expires_at && new Date(subscription.expires_at).getTime() <= Date.now())),
  );

  useEffect(() => {
    if (subLoading || !subscriptionExpired) return;
    setPricingOpen(true);
  }, [subLoading, subscriptionExpired]);

  useEffect(() => {
    if (authLoading || user || typeof window === "undefined") return;
    if (window.localStorage.getItem("gogosoft_pricing_shown")) return;

    const timeout = window.setTimeout(() => {
      setPricingOpen(true);
      window.localStorage.setItem("gogosoft_pricing_shown", "true");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [authLoading, user]);

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
      <PricingModal
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        isBlocking={subscriptionExpired}
        onCreateAccount={() => void navigate({ to: user ? "/abonnement" : "/auth" })}
      />
      <div className="bg-hero-ivoirien relative overflow-hidden rounded-2xl p-6 shadow-3d sm:p-8">
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700/75">
              Espace de travail
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              {greeting} <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="mt-2 text-base text-slate-700">Que voulez-vous faire aujourd'hui ?</p>
            {subscription ? <SubscriptionBadge subscription={subscription} /> : null}
            <p className="mt-3 text-sm font-medium text-slate-700/80">
              {roleLabel} · {shop?.name ?? "Votre atelier"}
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/60 bg-white/35 p-3 shadow-3d sm:block">
            <IconBadge3D icon={Wrench} size="lg" color="orange" />
          </div>
        </div>
      </div>

      {showRenewalBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-900 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <p className="font-medium">Votre abonnement expire dans {daysRemaining} jour(s).</p>
          </div>
          <Button
            asChild
            className="h-11 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d active:scale-95"
          >
            <Link to="/abonnement">Renouveler</Link>
          </Button>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            to: "/phone/atelier/nouveau",
            icon: Smartphone,
            label: "Nouvelle réparation",
            description: "Créer une fiche téléphone",
            color: "orange" as const,
          },
          {
            to: "/computer/atelier/nouveau",
            icon: Laptop,
            label: "Réparation PC",
            description: "Prendre en charge un ordinateur",
            color: "green" as const,
          },
          {
            to: "/clients/nouveau",
            icon: UserPlus,
            label: "Nouveau client",
            description: "Ajouter à votre carnet",
            color: "orange" as const,
          },
          {
            to: "/sales/nouveau",
            icon: ShoppingCart,
            label: "Nouvelle vente",
            description: "Enregistrer un produit vendu",
            color: "green" as const,
          },
        ].map(({ to, icon, label, description, color }) => (
          <Link key={to} to={to} className="group min-w-0">
            <Card className="card-3d h-32 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3d-hover">
              <CardContent className="flex h-full items-center gap-3 p-4 sm:gap-4 sm:p-5">
                <IconBadge3D
                  icon={icon}
                  size="md"
                  color={color}
                  className="size-14 shrink-0 rounded-xl [&_svg]:size-7"
                />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-slate-900 group-hover:text-orange-700">
                    {label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
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
        <Card className="card-3d rounded-2xl border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-3d-hover">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Les dernières actions sur vos fiches.
            </p>
          </CardHeader>
          <CardContent className="flex gap-4 overflow-x-auto pb-5">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="w-64 shrink-0 rounded-xl border border-border/70 bg-background p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <Activity className="size-4" />
                    </div>
                    <p className="text-xs font-semibold text-orange-700">
                      {formatRelativeTime(event.created_at)}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium">
                    {event.description ?? event.event_type}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="card-3d rounded-2xl border-0">
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

        <Card className="card-3d rounded-2xl border-0">
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
    </div>
  );
}
