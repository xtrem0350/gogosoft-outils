import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, RefreshCw, Store, TrendingUp, Users } from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, getSettledQueryError, withTimeout } from "@/lib/error-utils";

interface Shop {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface Subscription {
  plan: string;
  price_fcfa: number;
  expires_at: string;
}

interface DashboardErrors {
  shops: string | null;
  shopsCount: string | null;
  usersCount: string | null;
  newShops: string | null;
  subscriptions: string | null;
}

export function PlatformDashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalShops, setTotalShops] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [newShops, setNewShops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [queryErrors, setQueryErrors] = useState<DashboardErrors>({
    shops: null,
    shopsCount: null,
    usersCount: null,
    newShops: null,
    subscriptions: null,
  });

  useEffect(() => {
    let active = true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setLoading(true);
    setError(null);
    setQueryErrors({
      shops: null,
      shopsCount: null,
      usersCount: null,
      newShops: null,
      subscriptions: null,
    });

    void Promise.allSettled([
      withTimeout(Promise.resolve(supabase
        .from("shops")
        .select("id, name, owner_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10)), "Boutiques récentes"),
      withTimeout(Promise.resolve(supabase.from("shops").select("id", { count: "exact", head: true })), "Nombre de boutiques"),
      withTimeout(Promise.resolve(supabase.from("profiles").select("id", { count: "exact", head: true })), "Nombre d’utilisateurs"),
      withTimeout(Promise.resolve(supabase.from("shops")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())), "Nouvelles boutiques"),
      withTimeout(Promise.resolve(supabase
        .from("subscriptions")
        .select("plan, price_fcfa, expires_at")
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())), "Abonnements actifs"),
    ])
      .then(([shopsResult, shopsCount, usersCount, newShopCount, subscriptionsResult]) => {
        if (!active) return;
        const nextErrors: DashboardErrors = {
          shops: getSettledQueryError(shopsResult, "Impossible de charger les boutiques récentes."),
          shopsCount: getSettledQueryError(shopsCount, "Impossible de compter les boutiques."),
          usersCount: getSettledQueryError(usersCount, "Impossible de compter les utilisateurs."),
          newShops: getSettledQueryError(newShopCount, "Impossible de compter les nouvelles boutiques."),
          subscriptions: getSettledQueryError(subscriptionsResult, "Impossible de charger les abonnements."),
        };
        setQueryErrors(nextErrors);
        const messages = Object.entries(nextErrors)
          .filter((entry): entry is [string, string] => entry[1] !== null)
          .map(([source, message]) => `${source} : ${message}`);
        setError(messages.length ? messages.join(" · ") : null);

        if (shopsResult.status === "fulfilled" && !shopsResult.value.error) {
          setShops(shopsResult.value.data ?? []);
        }
        if (shopsCount.status === "fulfilled" && !shopsCount.value.error) {
          setTotalShops(shopsCount.value.count ?? 0);
        }
        if (usersCount.status === "fulfilled" && !usersCount.value.error) {
          setTotalUsers(usersCount.value.count ?? 0);
        }
        if (newShopCount.status === "fulfilled" && !newShopCount.value.error) {
          setNewShops(newShopCount.value.count ?? 0);
        }
        if (subscriptionsResult.status === "fulfilled" && !subscriptionsResult.value.error) {
          const subscriptions = (subscriptionsResult.value.data ?? []) as Subscription[];
          setMrr(
            subscriptions.reduce(
              (total, subscription) =>
                total +
                (subscription.plan === "annual" || subscription.plan === "annuel"
                  ? subscription.price_fcfa / 12
                  : subscription.price_fcfa),
              0,
            ),
          );
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(getErrorMessage(reason, "Impossible de charger les statistiques de la plateforme."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshVersion]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHero
        title="Dashboard plateforme"
        subtitle="Vue globale GogoSoft"
        icon={Store}
        imageSrc={new URL("../../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
        action={
          <Button asChild>
            <Link to="/admin/tenants">
              <Store className="mr-2 size-4" />
              Voir toutes les boutiques
            </Link>
          </Button>
        }
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setRefreshVersion((current) => current + 1)}
        >
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Actualisation…" : "Rafraîchir"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Boutiques</CardTitle>
            <Store className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? "…" : queryErrors.shopsCount ? "—" : totalShops}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Utilisateurs</CardTitle>
            <Users className="size-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? "…" : queryErrors.usersCount ? "—" : totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">MRR</CardTitle>
            <CreditCard className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? "…" : queryErrors.subscriptions ? "—" : `${mrr.toLocaleString("fr-FR")} FCFA`}</div></CardContent>
        </Card>
        <Card className="bg-ivoirien text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">NOUVELLES BOUTIQUES</CardTitle>
            <TrendingUp className="size-4" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{loading ? "…" : queryErrors.newShops ? "—" : `+${newShops} / 30j`}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Boutiques récentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : queryErrors.shops ? (
            <p role="alert" className="text-sm text-destructive">{queryErrors.shops}</p>
          ) : shops.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune boutique pour l’instant.</p>
          ) : (
            <div className="space-y-2">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to="/admin/tenants/$id"
                  params={{ id: shop.owner_id }}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-sm text-slate-500">
                      Créée le {new Date(shop.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">Boutique</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
