import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Users, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAllPayments,
  getGlobalStats,
  getRecentSignups,
  type AdminPayment,
  type AdminStats,
  type AdminTenant,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getGlobalStats(), getRecentSignups(5), getAllPayments(5)])
      .then(([nextStats, nextTenants, nextPayments]) => {
        setStats(nextStats);
        setTenants(nextTenants);
        setPayments(nextPayments);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Dashboard plateforme"
        subtitle="Suivi des abonnés, des revenus et de l'activité récente"
        icon={Users}
        imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop"
      />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total abonnés" value={stats?.total_tenants ?? "…"} icon={Users} />
        <StatsCard
          title="MRR (FCFA)"
          value={stats?.mrr_fcfa.toLocaleString("fr-FR") ?? "…"}
          icon={CreditCard}
          color="warning"
        />
        <StatsCard
          title="Taux de conversion"
          value={stats ? `${100 - stats.churn_rate}%` : "…"}
          icon={UserPlus}
          color="success"
        />
        <StatsCard
          title="Abonnements en retard"
          value={stats ? stats.total_tenants - stats.active_tenants : "…"}
          icon={AlertTriangle}
          color="danger"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>5 derniers abonnés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.length ? (
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between gap-4 border-b pb-3 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tenant.name}</p>
                    <p className="truncate text-muted-foreground">
                      {tenant.email ?? "Adresse indisponible"}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {tenant.plan ?? "Sans forfait"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun abonné récent.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>5 derniers paiements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 border-b pb-3 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {payment.plan ?? "Paiement"} · {payment.method}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {payment.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
