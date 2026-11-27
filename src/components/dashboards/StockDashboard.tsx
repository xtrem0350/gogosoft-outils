import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Package, Plus, Truck } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/services/demoService";
import {
  getStockItems,
  getSupplierOrders,
  type StockItem,
  type SupplierOrder,
} from "@/services/stockService";

interface StockMovement {
  id: string;
  stock_item_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string | null;
  created_at: string;
  stock_item: { name: string } | null;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMovementChart(movements: StockMovement[]) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 29 + index);
    return { key: dateKey(date), label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) };
  });
  const dailyNet = new Map(days.map(({ key }) => [key, 0]));
  for (const movement of movements) {
    if (movement.movement_type !== "in" && movement.movement_type !== "out") continue;
    const key = dateKey(new Date(movement.created_at));
    if (!dailyNet.has(key)) continue;
    dailyNet.set(
      key,
      (dailyNet.get(key) ?? 0) +
        (movement.movement_type === "in" ? movement.quantity : -movement.quantity),
    );
  }
  let cumulativeNet = 0;
  return days.map(({ key, label }) => {
    cumulativeNet += dailyNet.get(key) ?? 0;
    return { label, net: cumulativeNet };
  });
}

export function StockDashboard() {
  const { shopId } = useCurrentShop();
  const [items, setItems] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId || isDemoMode()) {
      setItems([]);
      setOrders([]);
      setMovements([]);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - 29);
    void Promise.all([
      getStockItems(shopId),
      getSupplierOrders(shopId),
      (supabase.from("stock_movements" as never) as never as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            gte: (column: string, value: string) => {
              order: (column: string, options: { ascending: boolean }) => {
                limit: (count: number) => Promise<{ data: unknown; error: Error | null }>;
              };
            };
          };
        };
      })
        .select("id, stock_item_id, movement_type, quantity, reason, created_at, stock_item:stock_items(name)")
        .eq("shop_id", shopId)
        .gte("created_at", rangeStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
    ])
      .then(([nextItems, nextOrders, movementResult]) => {
        if (!active) return;
        if (movementResult.error) throw movementResult.error;
        setItems(nextItems);
        setOrders(nextOrders);
        setMovements((movementResult.data ?? []) as StockMovement[]);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Impossible de charger le stock.");
        setItems([]);
        setOrders([]);
        setMovements([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  const ruptures = items.filter((item) => item.quantity <= 0);
  const lowStock = items.filter((item) => item.quantity > 0 && item.quantity <= item.min_quantity);
  const pendingOrders = orders.filter((order) => order.status !== "received").length;
  const totalValue = items.reduce((total, item) => total + item.quantity * item.unit_price, 0);
  const movementChart = useMemo(() => buildMovementChart(movements), [movements]);
  const formatAmount = (amount: number) => `${amount.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHero
        title="Mon espace magasin"
        subtitle="Stock et approvisionnements"
        icon={Boxes}
        iconColor="green"
        imageSrc={new URL("../../assets/images/hero-magasinier-consommables.jpg", import.meta.url).href}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild><Link to="/magasin"><Plus className="mr-2 size-4" />Nouvel article</Link></Button>
        <Button variant="outline" asChild><Link to="/magasin"><Boxes className="mr-2 size-4" />Nouvel inventaire</Link></Button>
        <Button asChild><Link to="/magasin"><Truck className="mr-2 size-4" />Fournisseurs</Link></Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {isDemoMode() ? (
        <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          Le stock réel n’est pas disponible en mode démo.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Articles en rupture</CardTitle>
            <Package className="size-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{loading ? "…" : ruptures.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Articles en stock bas</CardTitle>
            <AlertTriangle className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{loading ? "…" : lowStock.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Valeur totale du stock</CardTitle>
            <Boxes className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{loading ? "…" : formatAmount(totalValue)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution nette du stock — 30 jours</CardTitle>
            <p className="text-sm text-muted-foreground">Variation cumulée des entrées et sorties, hors ajustements.</p>
          </CardHeader>
          <CardContent>
            {movementChart.some((point) => point.net !== 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={movementChart} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value} article(s)`, "Variation nette"]} />
                    <Line type="monotone" dataKey="net" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Aucun mouvement d’entrée ou de sortie sur les 30 derniers jours.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alertes stock</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : ruptures.length + lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune alerte stock.</p>
            ) : (
              <div className="space-y-2">
                {[...ruptures, ...lowStock].slice(0, 8).map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 rounded-lg border p-3">
                    <span className="font-medium">{item.name}</span>
                    <span className={`shrink-0 text-sm ${item.quantity <= 0 ? "text-red-700" : "text-amber-700"}`}>
                      {item.quantity} / {item.min_quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Derniers mouvements</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun mouvement récent.</p>
          ) : (
            <div className="space-y-2">
              {movements.slice(0, 8).map((movement) => (
                <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{movement.stock_item?.name ?? "Article"}</p>
                    <p className="text-xs text-muted-foreground">
                      {movement.reason ?? "Mouvement"} · {new Date(movement.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${movement.movement_type === "in" ? "text-green-700" : movement.movement_type === "out" ? "text-orange-700" : "text-slate-600"}`}>
                    {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "−" : "±"}{movement.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Commandes fournisseurs en cours</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">{loading ? "…" : pendingOrders} commande(s) à réceptionner.</p>
          <Button variant="outline" asChild><Link to="/magasin">Gérer les approvisionnements</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
