import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CircleDollarSign, PackageCheck, ShoppingCart, Truck, Wallet } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { listSales, type Sale } from "@/services/salesService";

const CATEGORY_COLORS = ["#7c3aed", "#f97316", "#0f766e"];

export function SalesDashboard() {
  const { shopId } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setSales([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    void listSales(shopId)
      .then((nextSales) => {
        if (active) setSales(nextSales);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Impossible de charger les ventes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todaySales = sales.filter((sale) => sale.created_at.slice(0, 10) === todayKey);
  const deliveries = sales.filter(
    (sale) => sale.delivery_status === "pending" || sale.delivery_status === "ready",
  );
  const monthRevenue = sales
    .filter((sale) => sale.payment_status === "paid" && new Date(sale.created_at) >= monthStart)
    .reduce((total, sale) => total + sale.total_price, 0);
  const categoryData = useMemo(() => {
    const categories = [
      { key: "phone", name: "Téléphone" },
      { key: "computer", name: "Ordinateur" },
      { key: "consumable", name: "Consommable" },
    ];
    return categories
      .map((category) => ({
        name: category.name,
        value: sales.filter((sale) => sale.activity_type === category.key).reduce((sum, sale) => sum + sale.quantity, 0),
      }))
      .filter((category) => category.value > 0);
  }, [sales]);
  const formatAmount = (amount: number) => `${amount.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon espace ventes</h1>
          <p className="text-sm text-slate-500">Performance et commandes à livrer</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/sales/commandes">Voir commandes</Link></Button>
          <Button variant="outline" asChild><Link to="/sales">Voir livraisons</Link></Button>
          <Button asChild><Link to="/sales/nouveau">Nouvelle vente</Link></Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Ventes du jour</CardTitle>
            <ShoppingCart className="size-4 text-violet-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{loading ? "…" : todaySales.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Ventes à livrer</CardTitle>
            <PackageCheck className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{loading ? "…" : deliveries.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">CA du mois</CardTitle>
            <CircleDollarSign className="size-4 text-green-700" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{loading ? "…" : formatAmount(monthRevenue)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ventes par catégorie</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune vente enregistrée.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                      {categoryData.map((category, index) => (
                        <Cell key={category.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} article(s)`, "Vendus"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
              {categoryData.map((category, index) => (
                <span key={category.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                  {category.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Commandes en cours</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/sales/commandes">Tout voir <Truck /></Link></Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande à préparer ou livrer.</p>
            ) : (
              <div className="space-y-2">
                {deliveries.slice(0, 8).map((sale) => (
                  <Link key={sale.id} to="/sales/commandes" className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{sale.product_name}</p>
                      <p className="text-xs text-muted-foreground">{sale.client_name ?? "Client inconnu"} · ×{sale.quantity}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatAmount(sale.total_price)}</p>
                      <p className="text-xs text-muted-foreground">{sale.delivery_status === "ready" ? "Prête" : "À préparer"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Raccourcis</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/sales/nouveau"><ShoppingCart className="mr-2 size-4" />Nouvelle vente</Link></Button>
          <Button variant="outline" asChild><Link to="/sales/commandes"><Wallet className="mr-2 size-4" />Voir commandes</Link></Button>
          <Button asChild><Link to="/sales/commandes"><Truck className="mr-2 size-4" />Voir livraisons</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
