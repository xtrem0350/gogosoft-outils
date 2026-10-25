import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Store, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Shop {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface Subscription {
  plan: string;
  price_fcfa: number;
}

export function PlatformDashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalShops, setTotalShops] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [newShops, setNewShops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    void Promise.all([
      supabase
        .from("shops")
        .select("id, name, owner_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("shops").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("shops")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("subscriptions").select("plan, price_fcfa").eq("status", "active"),
    ])
      .then(([shopsResult, shopsCount, usersCount, newShopCount, subscriptionsResult]) => {
        if (!active) return;
        const results = [shopsResult, shopsCount, usersCount, newShopCount, subscriptionsResult];
        const failed = results.find((result) => result.error);
        if (failed?.error) throw failed.error;

        setShops(shopsResult.data ?? []);
        setTotalShops(shopsCount.count ?? 0);
        setTotalUsers(usersCount.count ?? 0);
        setNewShops(newShopCount.count ?? 0);
        const subscriptions = (subscriptionsResult.data ?? []) as Subscription[];
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
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les statistiques de la plateforme.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard plateforme</h1>
          <p className="text-sm text-slate-500">Vue globale GogoSoft</p>
        </div>
        <Button asChild>
          <Link to="/admin/tenants">
            <Store className="mr-2 size-4" />
            Voir toutes les boutiques
          </Link>
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
          <CardContent><div className="text-3xl font-bold">{totalShops}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Utilisateurs</CardTitle>
            <Users className="size-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">MRR</CardTitle>
            <CreditCard className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{mrr.toLocaleString("fr-FR")} FCFA</div></CardContent>
        </Card>
        <Card className="bg-ivoirien text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">NOUVELLES BOUTIQUES</CardTitle>
            <TrendingUp className="size-4" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">+{newShops} / 30j</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Boutiques récentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
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
