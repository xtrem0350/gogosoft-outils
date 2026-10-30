import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getStockItems, type StockItem } from "@/services/stockService";

export function StockDashboard() {
  const { shopId } = useCurrentShop();
  const [items, setItems] = useState<StockItem[]>([]);

  useEffect(() => {
    if (!shopId) return;
    void getStockItems(shopId).then(setItems).catch(() => setItems([]));
  }, [shopId]);

  const lowStock = items.filter((item) => item.quantity <= item.min_quantity);
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Mon espace magasin</h1><p className="text-sm text-slate-500">Stock et approvisionnements</p></div>
        <Button asChild><Link to="/magasin">Voir le magasin</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Articles</CardTitle><Boxes className="size-4 text-orange-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{items.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Stock bas</CardTitle><AlertTriangle className="size-4 text-amber-600" /></CardHeader><CardContent><div className="text-3xl font-bold">{lowStock.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Unités</CardTitle><Package className="size-4 text-green-800" /></CardHeader><CardContent><div className="text-3xl font-bold">{items.reduce((total, item) => total + item.quantity, 0)}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Alertes stock bas</CardTitle></CardHeader><CardContent>{lowStock.length === 0 ? <p className="text-sm text-slate-500">Aucune alerte stock.</p> : <div className="space-y-2">{lowStock.map((item) => <div key={item.id} className="flex justify-between rounded-lg border p-3"><span className="font-medium">{item.name}</span><span className="text-sm text-amber-700">{item.quantity} / {item.min_quantity}</span></div>)}</div>}</CardContent></Card>
    </div>
  );
}
