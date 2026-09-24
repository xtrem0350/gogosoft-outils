import { createFileRoute, redirect } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Shield, Store, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllPayments,
  getExpiringSubscriptions,
  getGlobalStats,
  getRecentSignups,
  type AdminPayment,
  type AdminStats,
  type AdminSubscription,
  type AdminTenant,
} from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile?.is_super_admin) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [expiring, setExpiring] = useState<AdminSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void Promise.all([
      getGlobalStats(),
      getRecentSignups(),
      getAllPayments(),
      getExpiringSubscriptions(),
    ])
      .then(([nextStats, nextTenants, nextPayments, nextExpiring]) => {
        setStats(nextStats);
        setTenants(nextTenants);
        setPayments(nextPayments);
        setExpiring(nextExpiring);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="size-7 text-orange-500" />
        <div>
          <p className="text-sm font-medium text-green-700">Administration</p>
          <h1 className="text-3xl font-bold">Espace Admin</h1>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Ateliers actifs"
          value={stats?.active_tenants ?? "…"}
          icon={Store}
          color="success"
        />
        <StatsCard
          title="MRR (FCFA)"
          value={stats?.mrr_fcfa ?? "…"}
          icon={CreditCard}
          color="warning"
        />
        <StatsCard
          title="Taux de conversion"
          value={stats ? `${100 - stats.churn_rate}%` : "…"}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Abonnements en retard"
          value={stats ? stats.total_tenants - stats.active_tenants : "…"}
          icon={AlertTriangle}
          color="danger"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Croissance des inscriptions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-6 gap-3 sm:grid-cols-12">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="h-24 rounded bg-orange-50" title={`Mois ${index + 1}`} />
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derniers inscrits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between border-b pb-2 text-sm"
              >
                <span>{tenant.name}</span>
                <span className="text-muted-foreground">{tenant.plan ?? "Sans forfait"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paiements récents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b pb-2 text-sm"
              >
                <span>{payment.method}</span>
                <span>{payment.amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Abonnements qui expirent dans 7 jours</CardTitle>
        </CardHeader>
        <CardContent>
          {expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun abonnement à surveiller.</p>
          ) : (
            expiring.map((subscription) => (
              <p key={subscription.user_id} className="text-sm">
                {subscription.user_id} ·{" "}
                {new Date(subscription.expires_at).toLocaleDateString("fr-FR")}
              </p>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Centralisez ici les demandes d’assistance des ateliers.
        </CardContent>
      </Card>
    </div>
  );
}
