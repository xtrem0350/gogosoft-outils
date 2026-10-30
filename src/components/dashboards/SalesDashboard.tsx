import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CircleDollarSign, ShoppingCart, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { listSales, type Sale } from "@/services/salesService";

export function SalesDashboard() {
  const { shopId } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!shopId) return;
    void listSales(shopId).then(setSales).catch(() => setSales([]));
  }, [shopId]);

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((sale) => sale.created_at.slice(0, 10) === today);
  const paidToday = todaySales.filter((sale) => sale.payment_status === "paid");
  const pending = sales.filter((sale) => sale.payment_status === "pending" || sale.payment_status === "awaiting_payment");
  const revenue = paidToday.reduce((total, sale) => total + sale.total_price, 0);
  const formatAmount = (amount: number) => `${amount.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Mon espace ventes</h1><p className="text-sm text-slate-500">Ventes du jour</p></div>
        <Button asChild><Link to="/sales">Voir les ventes</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">CA encaissé</CardTitle><CircleDollarSign className="size-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatAmount(revenue)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Transactions</CardTitle><Wallet className="size-4 text-green-800" /></CardHeader><CardContent><div className="text-3xl font-bold">{paidToday.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">En attente</CardTitle><ShoppingCart className="size-4 text-slate-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{pending.length}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Ventes récentes</CardTitle></CardHeader><CardContent>{sales.length === 0 ? <p className="text-sm text-slate-500">Aucune vente enregistrée.</p> : <div className="space-y-2">{sales.slice(0, 10).map((sale) => <div key={sale.id} className="flex justify-between rounded-lg border p-3"><div><p className="font-medium">{sale.product_name}</p><p className="text-xs text-slate-500">{sale.client_name ?? "Client inconnu"}</p></div><span className="font-medium">{formatAmount(sale.total_price)}</span></div>)}</div>}</CardContent></Card>
    </div>
  );
}
