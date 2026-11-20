import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getGlobalStats,
  getGrowthChart,
  getSuperAdminCashEntries,
  getSuperAdminCashStats,
  type AdminStats,
  type SuperAdminCashEntry,
  type SuperAdminCashStats,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/finances")({ component: FinancesPage });

function FinancesPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growth, setGrowth] = useState<Array<{ month: string; signups: number }>>([]);
  const [cashStats, setCashStats] = useState<SuperAdminCashStats | null>(null);
  const [cashEntries, setCashEntries] = useState<SuperAdminCashEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    void Promise.all([
      getGlobalStats(),
      getGrowthChart(),
      getSuperAdminCashStats(),
      getSuperAdminCashEntries({ from: startOfMonth }),
    ])
      .then(([nextStats, nextGrowth, nextCashStats, nextCashEntries]) => {
        if (!active) return;
        setStats(nextStats);
        setGrowth(nextGrowth);
        setCashStats(nextCashStats);
        setCashEntries(nextCashEntries);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Impossible de charger les finances.");
        }
      });

    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Revenus & MRR"
        subtitle="Revenus récurrents et croissance des abonnements"
        icon={TrendingUp}
      />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Caisse SuperAdmin</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Aujourd&apos;hui</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">
              {cashStats ? `${cashStats.today.toLocaleString("fr-FR")} FCFA` : "…"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Ce mois</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">
              {cashStats ? `${cashStats.month.toLocaleString("fr-FR")} FCFA` : "…"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">
              {cashStats ? `${cashStats.pending.toLocaleString("fr-FR")} FCFA` : "…"}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Derniers paiements reçus</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  {["Date", "Owner", "Montant", "Référence"].map((label) => (
                    <th key={label} className="px-3 py-2">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-3 py-3">
                      {new Date(entry.created_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-3">
                      {entry.owner_name ?? entry.description ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {entry.amount.toLocaleString("fr-FR")} {entry.currency}
                    </td>
                    <td className="px-3 py-3">{entry.reference ?? "—"}</td>
                  </tr>
                ))}
                {cashEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      Aucun paiement reçu ce mois-ci.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="MRR"
          value={stats?.mrr_fcfa.toLocaleString("fr-FR") ?? "…"}
          icon={TrendingUp}
        />
        <StatsCard
          title="ARR estimé"
          value={stats ? (stats.mrr_fcfa * 12).toLocaleString("fr-FR") : "…"}
          icon={TrendingUp}
          color="success"
        />
        <StatsCard
          title="Churn estimé"
          value={stats ? `${stats.churn_rate}%` : "…"}
          icon={TrendingUp}
          color="danger"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Croissance des abonnés</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="signups"
                name="Nouveaux abonnés"
                stroke="#f97316"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
