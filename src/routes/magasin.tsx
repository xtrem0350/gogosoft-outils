import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Truck, Warehouse } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import { createStockItem, getStockItems, getSupplierOrders, createSupplierOrder, adjustStock, type StockItem, type SupplierOrder } from "@/services/stockService";

export const Route = createFileRoute("/magasin")({ component: MagasinPage });

function MagasinPage() {
  const { shopId } = useCurrentShop();
  const [items, setItems] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [articleOpen, setArticleOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [minQuantity, setMinQuantity] = useState(5);
  const [unitPrice, setUnitPrice] = useState(1000);
  const [supplier, setSupplier] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<"entry" | "exit">("entry");
  const [movementQuantity, setMovementQuantity] = useState(1);
  const [movementReason, setMovementReason] = useState("");

  const refresh = async () => {
    if (!shopId) return;
    const [nextItems, nextOrders] = await Promise.all([getStockItems(shopId), getSupplierOrders(shopId)]);
    setItems(nextItems);
    setOrders(nextOrders);
  };

  useEffect(() => {
    void refresh();
  }, [shopId]);

  const lowStockCount = items.filter((item) => item.quantity <= item.min_quantity).length;
  const pendingOrders = orders.filter((order) => order.status !== "received").length;

  async function handleAdjustStock() {
    if (!shopId || !adjustItem) return;
    await adjustStock(shopId, adjustItem.id, movementType, movementQuantity, movementReason.trim() || "Ajustement manuel");
    setAdjustOpen(false);
    setAdjustItem(null);
    setMovementQuantity(1);
    setMovementReason("");
    await refresh();
  }

  async function handleCreateItem() {
    if (!shopId || !name.trim()) return;
    await createStockItem(shopId, {
      name: name.trim(),
      category: category.trim() || "Divers",
      quantity,
      min_quantity: minQuantity,
      unit_price: unitPrice,
      supplier: supplier.trim() || null,
    });
    setName("");
    setCategory("");
    setQuantity(10);
    setMinQuantity(5);
    setUnitPrice(1000);
    setSupplier("");
    setArticleOpen(false);
    await refresh();
  }

  async function markOrderReceived(order: SupplierOrder) {
    if (!shopId) return;
    const { error } = await supabase.from("supplier_orders").update({ status: "received", received_at: new Date().toISOString() }).eq("id", order.id);
    if (error) throw error;
    await refresh();
  }

  async function handleCreateOrder() {
    if (!shopId || !supplierName.trim()) return;
    await createSupplierOrder(shopId, {
      supplier_name: supplierName.trim(),
      total_amount: orderTotal,
      notes: "Commande créée depuis le module magasin",
      status: "pending",
    });
    setSupplierName("");
    setOrderTotal(0);
    setOrderOpen(false);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Magasin"
        subtitle="Suivi du stock et des commandes fournisseurs"
        icon={Warehouse}
        iconColor="green"
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => setOrderOpen(true)}><Truck className="mr-2 size-4" /> Commander fournisseur</Button>
            <Button className="bg-ivoirien hover:bg-ivoirien-hover" onClick={() => setArticleOpen(true)}><Plus className="mr-2 size-4" /> Nouvel article</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total articles" value={items.length} icon={Package} color="success" />
        <StatsCard title="Articles en stock bas" value={lowStockCount} icon={Warehouse} color="warning" />
        <StatsCard title="Commandes en attente" value={pendingOrders} icon={Truck} color="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="card-3d rounded-2xl">
          <CardHeader>
            <CardTitle>Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun article enregistré.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category ?? "Divers"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.quantity}</p>
                    {item.quantity <= item.min_quantity ? (
                      <span className="text-xs text-amber-700">Stock bas</span>
                    ) : (
                      <span className="text-xs text-emerald-700">OK</span>
                    )}
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => { setAdjustItem(item); setAdjustOpen(true); }}>Ajuster</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-3d rounded-2xl">
          <CardHeader>
            <CardTitle>Commandes fournisseurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande fournisseur.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{order.supplier_name}</p>
                    <p className="text-xs text-muted-foreground">{order.order_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-slate-700">{order.status}</span>
                    {order.status === "pending" ? <Button size="sm" variant="outline" onClick={() => void markOrderReceived(order)}>Marquer reçu</Button> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajuster {adjustItem?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Type de mouvement</Label><select value={movementType} onChange={(event) => setMovementType(event.target.value as "entry" | "exit")} className="h-10 rounded-md border px-3"><option value="entry">Entrée</option><option value="exit">Sortie</option></select></div>
            <div className="grid gap-2"><Label>Quantité</Label><Input type="number" min="1" value={movementQuantity} onChange={(event) => setMovementQuantity(Number(event.target.value || 1))} /></div>
            <div className="grid gap-2"><Label>Raison</Label><Input value={movementReason} onChange={(event) => setMovementReason(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdjustOpen(false)}>Annuler</Button><Button onClick={() => void handleAdjustStock()}>Valider</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={articleOpen} onOpenChange={setArticleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Nouvel article</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2"><Label>Nom</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-2"><Label>Catégorie</Label><Input value={category} onChange={(event) => setCategory(event.target.value)} /></div>
            <div className="space-y-2"><Label>Fournisseur</Label><Input value={supplier} onChange={(event) => setSupplier(event.target.value)} /></div>
            <div className="space-y-2"><Label>Quantité</Label><Input type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value || 0))} /></div>
            <div className="space-y-2"><Label>Stock minimum</Label><Input type="number" value={minQuantity} onChange={(event) => setMinQuantity(Number(event.target.value || 0))} /></div>
            <div className="space-y-2"><Label>Prix unitaire</Label><Input type="number" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value || 0))} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setArticleOpen(false)}>Annuler</Button>
            <Button className="bg-ivoirien hover:bg-ivoirien-hover" onClick={handleCreateItem}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Commande fournisseur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Fournisseur</Label><Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /></div>
            <div className="space-y-2"><Label>Montant total</Label><Input type="number" value={orderTotal} onChange={(event) => setOrderTotal(Number(event.target.value || 0))} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Annuler</Button>
            <Button className="bg-ivoirien hover:bg-ivoirien-hover" onClick={handleCreateOrder}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
