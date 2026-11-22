import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Users, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllPayments,
  getGlobalStats,
  getRecentSignups,
  resetSaas,
  type AdminPayment,
  type AdminStats,
  type AdminTenant,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.is_super_admin === true;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    void Promise.all([getGlobalStats(), getRecentSignups(5), getAllPayments(5)])
      .then(([nextStats, nextTenants, nextPayments]) => {
        if (!active) return;
        setStats(nextStats);
        setTenants(nextTenants);
        setPayments(nextPayments);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Chargement impossible.");
        }
      });
    return () => {
      active = false;
    };
  }, [refreshVersion]);

  async function confirmResetSaas() {
    if (!isSuperAdmin || resetConfirmation !== "RESET") return;
    setResetting(true);
    try {
      const deletedUsers = await resetSaas();
      toast.success(`Réinitialisation terminée : ${deletedUsers} compte(s) supprimé(s).`);
      setResetOpen(false);
      setResetConfirmation("");
      setRefreshVersion((current) => current + 1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Réinitialisation impossible.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Dashboard plateforme"
        subtitle="Suivi des abonnés, des revenus et de l'activité récente"
        icon={Users}
        imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop"
      />
      {isSuperAdmin ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              Supprime les comptes et leurs données métier. Le SuperAdmin et les trois comptes
              démo sont conservés.
            </p>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              Réinitialiser le SaaS
            </Button>
          </CardContent>
        </Card>
      ) : null}
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
      <AlertDialog
        open={resetOpen}
        onOpenChange={(open) => {
          if (resetting) return;
          setResetOpen(open);
          if (!open) setResetConfirmation("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le SaaS ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les comptes non protégés et leurs données métier seront supprimés définitivement.
              Cette action est irréversible. Les lignes catalogue liées aux boutiques supprimées
              seront également supprimées ; les catalogues et tarifs globaux resteront intacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={resetConfirmation}
            onChange={(event) => setResetConfirmation(event.target.value)}
            placeholder='Saisir "RESET" pour confirmer'
            autoComplete="off"
            spellCheck={false}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting || resetConfirmation !== "RESET"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmResetSaas();
              }}
            >
              {resetting ? "Réinitialisation…" : "Réinitialiser définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
