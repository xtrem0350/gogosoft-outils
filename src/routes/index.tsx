import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, BadgeDollarSign, ClipboardList, Plus, UserRound } from "lucide-react";

import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const stats = [
    { title: "Réparations en cours", value: 12, icon: Activity, trend: "+3 ce jour", color: "success" },
    { title: "Clients total", value: 184, icon: UserRound, trend: "+18 ce mois", color: "primary" },
    { title: "CA du mois", value: "1 250 000 FCFA", icon: BadgeDollarSign, trend: "Simulé", color: "warning" },
    { title: "Jours restants abonnement", value: 7, icon: ClipboardList, trend: "Essai actif", color: "danger" },
  ];

  const recentRepairs = [
    { id: "R-1042", client: "Amani Yao", device: "iPhone 12", status: "En cours" },
    { id: "R-1041", client: "Kouassi Cissé", device: "Samsung A54", status: "À vérifier" },
    { id: "R-1040", client: "Miriam N'Goran", device: "Tecno Camon 20", status: "Terminé" },
    { id: "R-1039", client: "Soro Benoit", device: "Xiaomi Redmi Note 12", status: "En cours" },
    { id: "R-1038", client: "Lamine Koffi", device: "Huawei P30", status: "En attente" },
  ];

  const recentClients = [
    { name: "Amani Yao", whatsapp: "+225 01 02 03 04", repairs: 4 },
    { name: "Kouassi Cissé", whatsapp: "+225 07 08 09 10", repairs: 3 },
    { name: "Miriam N'Goran", whatsapp: "+225 05 11 12 13", repairs: 2 },
    { name: "Soro Benoit", whatsapp: "+225 09 14 15 16", repairs: 5 },
    { name: "Lamine Koffi", whatsapp: "+225 06 17 18 19", repairs: 1 },
  ];

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
            {recentRepairs.map((repair) => (
              <div key={repair.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50">
                <div>
                  <p className="text-sm font-semibold">{repair.client}</p>
                  <p className="text-xs text-muted-foreground">
                    {repair.device} · {repair.id}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{repair.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-elevated border-0">
          <CardHeader>
            <CardTitle>Clients récents</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Les derniers clients enregistrés.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentClients.map((client) => (
              <div key={client.name} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.whatsapp}</p>
                </div>
                <span className="text-xs text-muted-foreground">{client.repairs} réparations</span>
              </div>
            ))}
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
