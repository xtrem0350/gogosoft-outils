import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Laptop,
  Package,
  Plus,
  Smartphone,
  ShoppingCart,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/EmptyState";
import { CreateShopModal } from "@/components/CreateShopModal";
import { IconBadge3D } from "@/components/IconBadge3D";
import { StatsCard } from "@/components/StatsCard";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { CashierDashboard } from "@/components/dashboards/CashierDashboard";
import { PlatformDashboard } from "@/components/dashboards/PlatformDashboard";
import { TechnicianDashboard } from "@/components/dashboards/TechnicianDashboard";
import { ReceptionDashboard } from "@/components/dashboards/ReceptionDashboard";
import { StockDashboard } from "@/components/dashboards/StockDashboard";
import { SalesDashboard } from "@/components/dashboards/SalesDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRoleLabel, useUserRoles } from "@/hooks/useUserRoles";
import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getCashSummary, type CashSummary } from "@/services/cashService";
import { isDemoMode } from "@/services/demoService";
import { getStockItems } from "@/services/stockService";
import { getTeamMembers, type TeamMember } from "@/services/teamService";
import { isSimulationMode } from "@/services/simulationService";
import { getAllTenants, getExpiringSubscriptions, getGlobalStats, getRecentSignups, type AdminStats, type AdminTenant, type AdminSubscription } from "@/services/adminService";
import { getClientsByShop, type ClientRecord } from "@/services/clientService";
import { listSales, type Sale } from "@/services/salesService";
import { getEvents, getTickets, getTicketsByTechnician, type WorkshopEvent } from "@/services/workshopService";
import type { WorkshopTicket } from "@/types/database";

export const Route = createFileRoute("/dashboard")({
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
  component: DashboardRouter,
});

const STATUS_LABELS: Record<string, string> = {
  en_attente_caissier_entree: "⏳ Entrée en caisse",
  en_attente_technicien: "🔧 En attente technicien",
  en_cours: "⚙️ En cours",
  en_attente_caissier_solde: "💰 Solde en attente",
  en_attente_receptionniste: "📥 En attente réception",
  livre: "✅ Livré",
  annule: "❌ Annulé",
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

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DashboardRouter() {
  const { activeRole, loading } = useUserRoles();
  if (loading) return <p className="p-8 text-center text-sm text-muted-foreground">Chargement...</p>;
  const noRoleState = (
    <EmptyState
      icon={UserRound}
      title="Rôle non attribué"
      description="Contactez le propriétaire de la boutique pour obtenir un accès."
    />
  );
  const dashboard = (() => {
    switch (activeRole) {
      case "owner":
        return <OwnerDashboard />;
      case "technicien":
        return <TechnicianDashboard />;
      case "caissier":
        return <CashierDashboard />;
      case "receptionniste":
        return <ReceptionDashboard />;
      case "magasinier":
        return <StockDashboard />;
      case "vendeur":
        return <SalesDashboard />;
      case "super_admin":
        return <PlatformDashboard />;
      default:
        return noRoleState;
    }
  })();

  return <Fragment key={activeRole}>{dashboard}</Fragment>;
}

function OwnerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { shop, shopId, loading: shopLoading, refresh } = useCurrentShop();
  const isMobile = useIsMobile();
  const { activeModules: modules, isModuleActive: hasModule, loading: modulesLoading } = useActiveModules();
  const { subscription, daysRemaining, loading: subLoading } = useSubscription();

  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const [technicians, setTechnicians] = useState<TeamMember[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [events, setEvents] = useState<WorkshopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const createShopAction = (
    <Button
      type="button"
      variant="default"
      className="border-white/70"
      onClick={() => setCreateOpen(true)}
    >
      <Plus className="mr-2 size-4" />
      Créer une boutique
    </Button>
  );

  const load = useCallback(async () => {
    if (isSimulationMode()) {
      setTickets([]);
      setClients([]);
      setSales([]);
      setEvents([]);
      setCashSummary(null);
      setTechnicians([]);
      setLowStockCount(0);
      setError(null);
      setLoading(false);
      return;
    }
    if (!shopId) {
      setTickets([]);
      setClients([]);
      setSales([]);
      setEvents([]);
      setCashSummary(null);
      setTechnicians([]);
      setLowStockCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const activityTypes = [
        ...(hasModule("reparation-telephone") ? (["phone"] as const) : []),
        ...(hasModule("reparation-pc") ? (["computer"] as const) : []),
      ];
      const saleTypes = [
        ...(hasModule("vente-telephone") ? (["phone"] as const) : []),
        ...(hasModule("vente-pc") ? (["computer"] as const) : []),
      ];
      const periodStart = new Date();
      periodStart.setHours(0, 0, 0, 0);
      periodStart.setDate(periodStart.getDate() - 34);
      const [ticketLists, clientList, saleLists, summary, teamMembers, stockItems] = await Promise.all([
        Promise.all(activityTypes.map((type) => getTickets(shopId, type))),
        activityTypes.length > 0 || saleTypes.length > 0
          ? getClientsByShop(shopId)
          : Promise.resolve([]),
        Promise.all(saleTypes.map((type) => listSales(shopId, type))),
        getCashSummary(shopId, { start: periodStart, end: new Date() }),
        isDemoMode() ? Promise.resolve([]) : getTeamMembers(shopId),
        !isDemoMode() && hasModule("consommables")
          ? getStockItems(shopId)
          : Promise.resolve([]),
      ]);
      const ticketList = ticketLists.flat();
      const eventLists = await Promise.all(
        ticketList.slice(0, 5).map((ticket) => getEvents(ticket.id)),
      );
      setTickets(ticketList);
      setClients(clientList);
      setSales(saleLists.flat());
      setCashSummary(summary);
      setTechnicians(teamMembers);
      setLowStockCount(stockItems.filter((item) => item.quantity <= item.min_quantity).length);
      setEvents(
        eventLists
          .flat()
          .sort((left, right) => (right.created_at ?? "").localeCompare(left.created_at ?? ""))
          .slice(0, 5),
      );
    } catch (reason) {
      if (isSimulationMode()) {
        setError(null);
        return;
      }
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger les données de la boutique.",
      );
      setCashSummary(null);
      setTechnicians([]);
      setLowStockCount(0);
    } finally {
      setLoading(false);
    }
  }, [hasModule, shopId]);

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
  const roleLabel = getRoleLabel("owner");
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  const cashRows = useMemo(
    () => [
      ...(cashSummary?.workshopPayments ?? []).map(({ amount, created_at }) => ({ amount, created_at })),
      ...(cashSummary?.sales ?? []).map(({ total_price, created_at }) => ({ amount: total_price, created_at })),
      ...(cashSummary?.manualEntries ?? []).map(({ amount, created_at }) => ({ amount, created_at })),
    ],
    [cashSummary],
  );
  const revenueForDate = (key: string) =>
    cashRows
      .filter((row) => getLocalDateKey(new Date(row.created_at)) === key)
      .reduce((total, row) => total + row.amount, 0);
  const todayRevenue = revenueForDate(todayKey);
  const yesterdayRevenue = revenueForDate(yesterdayKey);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = cashRows
    .filter((row) => new Date(row.created_at) >= currentMonthStart)
    .reduce((total, row) => total + row.amount, 0);
  const monthRevenueYesterday = cashRows
    .filter((row) => new Date(row.created_at) >= currentMonthStart && getLocalDateKey(new Date(row.created_at)) !== todayKey)
    .reduce((total, row) => total + row.amount, 0);
  const formatTrend = (current: number, previous: number, suffix = "vs hier") => {
    if (previous === 0) return current > 0 ? `Nouveau ${suffix}` : `0% ${suffix}`;
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change > 0 ? "+" : ""}${change}% ${suffix}`;
  };
  const repairsCreatedToday = tickets.filter(
    (ticket) => ticket.created_at && getLocalDateKey(new Date(ticket.created_at)) === todayKey,
  ).length;
  const repairsCreatedYesterday = tickets.filter(
    (ticket) => ticket.created_at && getLocalDateKey(new Date(ticket.created_at)) === yesterdayKey,
  ).length;
  const salesToday = sales.filter((sale) => getLocalDateKey(new Date(sale.created_at)) === todayKey);
  const salesYesterday = sales.filter((sale) => getLocalDateKey(new Date(sale.created_at)) === yesterdayKey);
  const chartStart = new Date(now);
  chartStart.setHours(0, 0, 0, 0);
  chartStart.setDate(chartStart.getDate() - 29);
  const revenueChart = useMemo(() => {
    const points = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(chartStart);
      day.setDate(day.getDate() + index);
      const key = getLocalDateKey(day);
      const amount = cashRows
        .filter((row) => getLocalDateKey(new Date(row.created_at)) === key)
        .reduce((total, row) => total + row.amount, 0);
      return { day: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), amount };
    });
    return points;
  }, [cashRows, chartStart]);
  const topProducts = useMemo(() => {
    const start = new Date(chartStart);
    const products = new Map<string, number>();
    for (const sale of sales) {
      if (sale.payment_status !== "paid" || new Date(sale.created_at) < start) continue;
      products.set(sale.product_name, (products.get(sale.product_name) ?? 0) + sale.quantity);
    }
    return [...products.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);
  }, [sales, chartStart]);
  const topTechnicians = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return technicians
      .filter((member) => member.role.toLocaleLowerCase().includes("technicien"))
      .map((member) => ({
        name: member.full_name ?? "Technicien",
        repairs: tickets.filter((ticket) => {
          const completedAt = new Date(ticket.delivered_at ?? ticket.updated_at ?? "");
          return ticket.technicien_id === member.user_id &&
            ticket.status === "livre" &&
            Number.isFinite(completedAt.getTime()) &&
            completedAt >= start;
        }).length,
      }))
      .filter((member) => member.repairs > 0)
      .sort((left, right) => right.repairs - left.repairs)
      .slice(0, 5);
  }, [technicians, tickets, now]);
  const overdueRepairs = tickets.filter((ticket) => {
    if (!ticket.created_at || ticket.status === "livre" || ticket.status === "annule") return false;
    return now.getTime() - new Date(ticket.created_at).getTime() > 7 * 86_400_000;
  });
  const salesTodayCount = salesToday.length;
  const hasPhoneRepairModule = hasModule("reparation-telephone");
  const hasComputerRepairModule = hasModule("reparation-pc");
  const hasRepairModule = hasPhoneRepairModule || hasComputerRepairModule;
  const hasSalesModule = hasModule("vente-telephone") || hasModule("vente-pc");
  const hasClientModule = hasRepairModule || hasSalesModule;
  const formatAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  });
  const quickActions = [
    ...(hasModule("reparation-telephone")
      ? [
          {
            to: "/phone/atelier/nouveau",
            icon: Smartphone,
            label: "Nouvelle réparation téléphone",
            description: "Créer une fiche téléphone",
            color: "orange" as const,
          },
        ]
      : []),
    ...(hasModule("reparation-pc")
      ? [
          {
            to: "/computer/atelier/nouveau",
            icon: Laptop,
            label: "Nouvelle réparation PC",
            description: "Prendre en charge un ordinateur",
            color: "green" as const,
          },
        ]
      : []),
    ...(hasModule("vente-telephone") || hasModule("vente-pc")
      ? [
          {
            to: "/sales/nouveau",
            icon: ShoppingCart,
            label: "Nouvelle vente",
            description: "Enregistrer un produit vendu",
            color: "green" as const,
          },
        ]
      : []),
    {
      to: "/caisse",
      icon: Wallet,
      label: "Voir la caisse",
      description: "Suivre les encaissements du jour",
      color: "orange" as const,
    },
    {
      to: "/magasin",
      icon: Package,
      label: "Voir le stock",
      description: "Contrôler les alertes et les mouvements",
      color: "orange" as const,
    },
    {
      to: "/equipe",
      icon: Users,
      label: "Voir l’équipe",
      description: "Consulter les membres de la boutique",
      color: "green" as const,
    },
    ...(hasModule("consommables")
      ? [
          {
            to: "/consumable/stock/nouveau",
            icon: Package,
            label: "Ajouter au stock",
            description: "Enregistrer une pièce ou un accessoire",
            color: "orange" as const,
          },
        ]
      : []),
    ...(hasClientModule
      ? [{
      to: "/clients/nouveau",
      icon: UserPlus,
      label: "Nouveau client",
      description: "Ajouter à votre carnet",
      color: "orange" as const,
    }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {!isMobile ? (
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
          <div className="absolute bottom-4 right-4 sm:relative sm:bottom-auto sm:right-auto">
            {createShopAction}
          </div>
        </div>
        </div>
      ) : null}
      {!isMobile ? (
        <CreateShopModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={(newShopId) => {
            window.localStorage.setItem("gogosoft.currentShopId", newShopId);
            void refresh(user?.id, true);
          }}
        />
      ) : null}

      {isSimulationMode() ? (
        <div className="mb-4 rounded-lg bg-orange-100 px-4 py-2 text-sm text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          🎬 Mode simulation — Données fictives pour démonstration
        </div>
      ) : null}

      {!isMobile && showRenewalBanner ? (
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
            <Link to="/abonnement" search={{ activate: undefined }}>Renouveler</Link>
          </Button>
        </div>
      ) : null}

      {!isMobile && error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      ) : null}

      {!isMobile ? (
        modulesLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des domaines…</p>
        ) : modules.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun domaine activé"
            description="Choisissez les domaines à découvrir pour afficher les outils de votre atelier."
            actionLabel="Choisir mes domaines"
            onAction={() => void navigate({ to: "/demo" })}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map(({ to, icon, label, description, color }) => (
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
                      <p className="font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-orange-700">
                        {label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Chiffre d’affaires du jour"
          value={busy ? "…" : formatAmount.format(todayRevenue)}
          icon={CreditCard}
          trend={formatTrend(todayRevenue, yesterdayRevenue)}
          color="warning"
        />
        <StatsCard
          title="Chiffre d’affaires du mois"
          value={busy ? "…" : formatAmount.format(monthRevenue)}
          icon={Wallet}
          trend={formatTrend(monthRevenue, monthRevenueYesterday)}
          color="primary"
        />
        <StatsCard
          title="Réparations en cours"
          value={busy ? "…" : enCours}
          icon={Activity}
          trend={`${formatTrend(repairsCreatedToday, repairsCreatedYesterday, "fiches créées vs hier")}`}
          color="success"
        />
        <StatsCard
          title="Ventes du jour"
          value={busy ? "…" : salesTodayCount}
          icon={ShoppingCart}
          trend={formatTrend(salesTodayCount, salesYesterday.length)}
          color="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="card-3d rounded-2xl border-0">
          <CardHeader>
            <CardTitle>Chiffre d’affaires — 30 jours</CardTitle>
            <p className="text-sm text-muted-foreground">Encaissements atelier, ventes réglées et entrées manuelles.</p>
          </CardHeader>
          <CardContent>
            {revenueChart.some((point) => point.amount > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChart} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatAmount.format(Number(value)), "CA"]} />
                    <Line type="monotone" dataKey="amount" stroke="#166534" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun encaissement sur les 30 derniers jours.</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-3d rounded-2xl border-0">
          <CardHeader><CardTitle>Top 5 produits vendus</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune vente réglée sur les 30 derniers jours.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value} vendu(s)`, "Quantité"]} />
                    <Bar dataKey="quantity" name="Quantité" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-3d rounded-2xl border-0">
          <CardHeader className="flex-row items-center gap-2">
            <BarChart3 className="size-5 text-blue-600" />
            <CardTitle>Top 5 techniciens — ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            {topTechnicians.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune réparation terminée par un technicien ce mois-ci.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTechnicians} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value} réparation(s)`, "Terminées"]} />
                    <Bar dataKey="repairs" name="Terminées" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-3d rounded-2xl border-0">
          <CardHeader><CardTitle>Alertes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {busy || subLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des alertes…</p>
            ) : (
              <>
                {lowStockCount > 0 ? (
                  <Link to="/magasin" className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
                    <Package className="size-4 shrink-0" />
                    {lowStockCount} article(s) en stock bas
                  </Link>
                ) : null}
                {subscription && daysRemaining <= 30 ? (
                  <Link to="/abonnement" search={{ activate: undefined }} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangle className="size-4 shrink-0" />
                    {daysRemaining <= 0 ? "Abonnement expiré" : `Abonnement expire dans ${daysRemaining} jour(s)`}
                  </Link>
                ) : null}
                {overdueRepairs.length > 0 ? (
                  <Link to={overdueRepairs[0]?.activity_type === "computer" ? "/computer/atelier" : "/phone/atelier"} className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <Wrench className="size-4 shrink-0" />
                    {overdueRepairs.length} réparation(s) en retard de plus de 7 jours
                  </Link>
                ) : null}
                {lowStockCount === 0 && (!subscription || daysRemaining > 30) && overdueRepairs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune alerte prioritaire.</p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {!isMobile ? (
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
        {hasPhoneRepairModule ? <Card className="card-3d rounded-2xl border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Réparations téléphone récentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Les 5 dernières fiches téléphone.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/phone/atelier">
                Voir tout
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : tickets.filter((ticket) => ticket.activity_type === "phone").length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Aucune réparation téléphone"
                description="Créez votre première fiche téléphone pour suivre une réparation."
                actionLabel="Nouvelle fiche"
                onAction={() => void navigate({ to: "/phone/atelier/nouveau" })}
              />
            ) : (
              tickets.filter((ticket) => ticket.activity_type === "phone").slice(0, 5).map((repair) => (
                <Link
                  key={repair.id}
                  to="/phone/atelier/$id"
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
        </Card> : null}

        {hasComputerRepairModule ? <Card className="card-3d rounded-2xl border-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Réparations PC récentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Les 5 dernières fiches ordinateur.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/computer/atelier">
                Voir tout
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {busy ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : tickets.filter((ticket) => ticket.activity_type === "computer").length === 0 ? (
              <EmptyState
                icon={Laptop}
                title="Aucune réparation PC"
                description="Créez votre première fiche PC pour suivre une réparation."
                actionLabel="Nouvelle fiche PC"
                onAction={() => void navigate({ to: "/computer/atelier/nouveau" })}
              />
            ) : (
              tickets.filter((ticket) => ticket.activity_type === "computer").slice(0, 5).map((repair) => (
                <Link
                  key={repair.id}
                  to="/computer/atelier/$id"
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
        </Card> : null}

        {hasClientModule ? <Card className="card-3d rounded-2xl border-0">
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
        </Card> : null}
        </div>
      ) : null}
    </div>
  );
}
