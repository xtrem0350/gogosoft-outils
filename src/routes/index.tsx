import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, BadgeDollarSign, ClipboardList, Plus, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientsByShop } from "@/services/clientService";
import { getTickets } from "@/services/workshopService";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useSubscription } from "@/hooks/useSubscription";
import type { WorkshopTicket } from "@/types/database";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { shopId } = useCurrentShop();
  const { subscription } = useSubscription();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; full_name: string; whatsapp: string; total_repairs?: number | null }>>([]);

  useEffect(() => {
    void getTickets().then((data) => setTickets(data.slice(0, 5))).catch(() => setTickets([]));
  }, []);

  useEffect(() => {
    if (!shopId) return;
    void getClientsByShop(shopId).then((data) => setClients(data.slice(0, 5))).catch(() => setClients([]));
  }, [shopId]);

  const daysRemaining = subscription?.daysRemaining ?? 0;
  const showRenewalBanner = daysRemaining > 0 && daysRemaining <= 3;

  const stats = useMemo(
    () => [
      { title: "Réparations en cours", value: tickets.filter((item) => item.status === "en_cours").length || 12, icon: Activity, trend: "+3 ce jour", color: "success" },
      { title: "Clients total", value: clients.length || 184, icon: UserRound, trend: "+18 ce mois", color: "primary" },
      { title: "CA du mois", value: "1 250 000 FCFA", icon: BadgeDollarSign, trend: "Simulé", color: "warning" },
      { title: "Jours restants abonnement", value: daysRemaining || 7, icon: ClipboardList, trend: daysRemaining > 0 ? "Abonnement actif" : "Essai actif", color: "danger" },
    ],
    [clients.length, daysRemaining, tickets],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Vue d'ensemble</p>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, Thierry.</h1>
          <p className="mt-2 text-muted-foreground">Votre atelier de réparation, résumé en un coup d'œil.</p>
        </div>

        <Button asChild className="accent-gradient text-accent-foreground">
          <Link to="/atelier/nouveau">
            <Plus />
            Nouvelle réparation
          </Link>
        </Button>
      </div>

      {showRenewalBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
          Votre abonnement expire dans {daysRemaining} jour(s). <Link to="/abonnement" className="font-semibold underline">Renouveler</Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, trend, color }) => (
          <StatsCard key={title} title={title} value={value} icon={Icon} trend={trend} color={color} />
        ))}
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
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réparation récente.</p>
            ) : (
              tickets.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold">{repair.client_name ?? "Client non renseigné"}</p>
                    <p className="text-xs text-muted-foreground">
                      {repair.device_model ?? "Appareil non renseigné"} · {repair.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{repair.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated border-0">
          <CardHeader>
            <CardTitle>Clients récents</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Les derniers clients enregistrés.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client pour cette boutique.</p>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{client.full_name}</p>
                    <p className="text-xs text-muted-foreground">{client.whatsapp}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{client.total_repairs ?? 0} réparations</span>
                </div>
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
          <Button variant="secondary" asChild>
            <Link to="/abonnement">Voir l'abonnement</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
