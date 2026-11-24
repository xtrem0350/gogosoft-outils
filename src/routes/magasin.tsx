import { createFileRoute } from "@tanstack/react-router";
import { Archive, ClipboardList, History, Package, Pencil, Plus, Truck, Users, Warehouse } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import {
  archiveStockItem,
  archiveSupplier,
  adjustStock,
  createStockItem,
  createSupplier,
  createSupplierOrder,
  createInventory,
  getInventories,
  getInventoryDetails,
  getStockItems,
  getSupplierOrders,
  getSuppliers,
  listStockItems,
  receiveSupplierOrder,
  updateInventoryLine,
  updateStockItem,
  updateSupplier,
  validateInventory,
  type Inventory,
  type InventoryDetails,
  type StockItem,
  type Supplier,
  type SupplierOrder,
  type SupplierOrderArticle,
} from "@/services/stockService";
import { toast } from "sonner";

export const Route = createFileRoute("/magasin")({ component: MagasinPage });

interface ItemForm {
  name: string;
  category: string;
  quantity: string;
  min_quantity: string;
  unit_price: string;
  supplier_id: string;
}

const emptyItemForm: ItemForm = {
  name: "",
  category: "",
  quantity: "0",
  min_quantity: "0",
  unit_price: "0",
  supplier_id: "",
};

function MagasinPage() {
  const { shopId } = useCurrentShop();
  const [items, setItems] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tab, setTab] = useState<"stock" | "suppliers" | "inventories">("stock");
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [inventoryDetails, setInventoryDetails] = useState<InventoryDetails | null>(null);
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, string>>({});
  const [inventoryToValidate, setInventoryToValidate] = useState<InventoryDetails | null>(null);
  const [supplierArchived, setSupplierArchived] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToArchive, setSupplierToArchive] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderSupplierId, setOrderSupplierId] = useState("");
  const [orderLines, setOrderLines] = useState<
    Array<{ stock_item_id: string; quantity: number; unit_price: number }>
  >([]);
  const [receivingOrder, setReceivingOrder] = useState<SupplierOrder | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!shopId) return;
    try {
      const [nextItems, nextOrders, nextSuppliers] = await Promise.all([
        getStockItems(shopId),
        getSupplierOrders(shopId),
        getSuppliers(shopId, supplierArchived),
      ]);
      setItems(nextItems);
      setOrders(nextOrders);
      setSuppliers(nextSuppliers);
      if (!selectedSupplierId && nextSuppliers.length) {
        setSelectedSupplierId(nextSuppliers[0]?.id ?? "");
      }
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de charger le magasin.");
    }
  }

  useEffect(() => {
    void refresh();
  }, [shopId, supplierArchived]);

  const refreshInventories = useCallback(async () => {
    if (!shopId) return;
    try {
      setInventories(await getInventories(shopId));
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de charger les inventaires.");
    }
  }, [shopId]);

  useEffect(() => {
    if (tab === "inventories") void refreshInventories();
  }, [refreshInventories, tab]);

  const lowStockCount = items.filter((item) => item.quantity <= item.min_quantity).length;
  const pendingOrders = orders.filter((order) => order.status !== "received").length;
  const orderTotal = orderLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);

  async function openInventory(inventoryId: string) {
    try {
      const details = await getInventoryDetails(inventoryId);
      setInventoryDetails(details);
      setInventoryQuantities(
        Object.fromEntries(details.lines.map((line) => [line.id, String(line.real_qty ?? 0)])),
      );
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de charger cet inventaire.");
    }
  }

  async function startInventory() {
    if (!shopId) return;
    setBusy(true);
    try {
      const created = await createInventory(shopId);
      await refreshInventories();
      await openInventory(created.id);
      toast.success("Inventaire brouillon créé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de créer l'inventaire.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmInventoryValidation() {
    if (!inventoryToValidate) return;
    setBusy(true);
    try {
      for (const line of inventoryToValidate.lines) {
        const quantity = Number(inventoryQuantities[line.id] ?? line.real_qty ?? 0);
        if (!Number.isFinite(quantity) || quantity < 0) {
          throw new Error(`Quantité réelle invalide pour ${line.stock_item?.name ?? "un article"}.`);
        }
        await updateInventoryLine(line.id, quantity);
      }
      const validated = await validateInventory(inventoryToValidate.id);
      setInventoryDetails(validated);
      setInventoryToValidate(null);
      await refreshInventories();
      toast.success("Inventaire validé et stock ajusté.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de valider l'inventaire.");
    } finally {
      setBusy(false);
    }
  }

  function openSupplierDialog(supplier?: Supplier) {
    setEditingSupplier(supplier ?? null);
    setSupplierName(supplier?.name ?? "");
    setSupplierContact(supplier?.contact_name ?? "");
    setSupplierPhone(supplier?.phone ?? "");
    setSupplierEmail(supplier?.email ?? "");
    setSupplierNotes(supplier?.notes ?? "");
    setSupplierDialogOpen(true);
  }

  async function saveSupplier() {
    if (!shopId || !supplierName.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }
    setBusy(true);
    try {
      const data = {
        name: supplierName,
        contact_name: supplierContact,
        phone: supplierPhone,
        email: supplierEmail,
        notes: supplierNotes,
      };
      const saved = editingSupplier
        ? await updateSupplier(shopId, editingSupplier.id, data)
        : await createSupplier(shopId, data);
      setSelectedSupplierId(saved.id);
      setSupplierDialogOpen(false);
      await refresh();
      toast.success(editingSupplier ? "Fournisseur modifié." : "Fournisseur créé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'enregistrer le fournisseur.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmArchiveSupplier() {
    if (!shopId || !supplierToArchive) return;
    setBusy(true);
    try {
      await archiveSupplier(shopId, supplierToArchive.id);
      setSupplierToArchive(null);
      if (selectedSupplierId === supplierToArchive.id) setSelectedSupplierId("");
      await refresh();
      toast.success("Fournisseur archivé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'archiver le fournisseur.");
    } finally {
      setBusy(false);
    }
  }

  async function openOrderDialog() {
    if (!shopId) return;
    try {
      const [availableItems, activeSuppliers] = await Promise.all([
        listStockItems(shopId),
        getSuppliers(shopId),
      ]);
      if (!activeSuppliers.length) {
        toast.error("Créez un fournisseur avant de passer une commande.");
        setTab("suppliers");
        return;
      }
      if (!availableItems.length) {
        toast.error("Créez au moins un article avant de passer une commande.");
        return;
      }
      setOrderSupplierId(activeSuppliers[0]?.id ?? "");
      setOrderLines([
        {
          stock_item_id: availableItems[0]?.id ?? "",
          quantity: 1,
          unit_price: availableItems[0]?.unit_price ?? 0,
        },
      ]);
      setOrderDialogOpen(true);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de préparer la commande.");
    }
  }

  async function saveOrder() {
    if (!shopId || !orderSupplierId || !orderLines.length) {
      toast.error("Sélectionnez un fournisseur et au moins un article.");
      return;
    }
    if (new Set(orderLines.map((line) => line.stock_item_id)).size !== orderLines.length) {
      toast.error("Un article ne peut apparaître qu'une fois dans une commande.");
      return;
    }
    setBusy(true);
    try {
      const activeSuppliers = await getSuppliers(shopId);
      const supplier = activeSuppliers.find((item) => item.id === orderSupplierId);
      if (!supplier) {
        toast.error("Le fournisseur sélectionné n'est plus disponible.");
        return;
      }
      const availableItems = await listStockItems(shopId);
      const articles: SupplierOrderArticle[] = orderLines.map((line) => {
        const item = availableItems.find((entry) => entry.id === line.stock_item_id);
        if (!item) throw new Error("Un article de la commande n'est plus disponible.");
        return {
          stock_item_id: item.id,
          name: item.name,
          quantity: line.quantity,
          unit_price: line.unit_price,
        };
      });
      await createSupplierOrder(shopId, {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        articles,
        total_amount: orderTotal,
        notes: "Commande créée depuis le module magasin",
        status: "pending",
      });
      setOrderDialogOpen(false);
      setOrderLines([]);
      await refresh();
      toast.success("Commande fournisseur créée.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de créer la commande.");
    } finally {
      setBusy(false);
    }
  }

  async function addOrderLine() {
    if (!shopId) return;
    try {
      const available = await listStockItems(shopId);
      const selectedIds = new Set(orderLines.map((line) => line.stock_item_id));
      const first = available.find((item) => !selectedIds.has(item.id));
      if (first) {
        setOrderLines((current) => [...current, {
          stock_item_id: first.id,
          quantity: 1,
          unit_price: first.unit_price,
        }]);
      } else {
        toast.error("Tous les articles disponibles sont déjà dans la commande.");
      }
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de charger les articles.");
    }
  }

  function prepareReceipt(order: SupplierOrder) {
    const lines = order.articles ?? [];
    if (!lines.length) {
      toast.error("Cette commande n'a pas de lignes d'articles. Elle ne peut pas être réceptionnée.");
      return;
    }
    setReceivingOrder(order);
    setReceivedQuantities(
      Object.fromEntries(lines.map((line) => [line.stock_item_id, String(line.quantity)])),
    );
  }

  async function submitReceipt() {
    if (!receivingOrder) return;
    setBusy(true);
    try {
      await receiveSupplierOrder(
        receivingOrder.id,
        (receivingOrder.articles ?? []).map((line) => ({
          stock_item_id: line.stock_item_id,
          quantity_received: Number(receivedQuantities[line.stock_item_id] ?? 0),
        })),
      );
      setReceivingOrder(null);
      await refresh();
      toast.success("Commande réceptionnée et stock mis à jour.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de réceptionner la commande.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Magasin"
        subtitle="Suivi du stock et des commandes fournisseurs"
        icon={Warehouse}
        iconColor="green"
        action={
          <Button
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={() => void openOrderDialog()}
          >
            <Truck className="mr-2 size-4" />
            Commander fournisseur
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total articles" value={items.length} icon={Package} color="success" />
        <StatsCard title="Articles en stock bas" value={lowStockCount} icon={Warehouse} color="warning" />
        <StatsCard title="Commandes en attente" value={pendingOrders} icon={Truck} color="danger" />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections du magasin">
        <Button
          type="button"
          variant={tab === "stock" ? "default" : "outline"}
          onClick={() => setTab("stock")}
        >
          <Package className="mr-2 size-4" />
          Articles et commandes
        </Button>
        <Button
          type="button"
          variant={tab === "suppliers" ? "default" : "outline"}
          onClick={() => setTab("suppliers")}
        >
          <Users className="mr-2 size-4" />
          Fournisseurs
        </Button>
        <Button
          type="button"
          variant={tab === "inventories" ? "default" : "outline"}
          onClick={() => setTab("inventories")}
        >
          <ClipboardList className="mr-2 size-4" />
          Inventaires
        </Button>
      </div>

      {tab === "inventories" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Historique des inventaires</CardTitle>
              <Button type="button" disabled={busy || !shopId} onClick={() => void startInventory()}>
                <Plus className="mr-1 size-4" />
                Nouvel inventaire
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {inventories.map((inventory) => (
                <button
                  type="button"
                  key={inventory.id}
                  onClick={() => void openInventory(inventory.id)}
                  className={`w-full rounded-lg border p-3 text-left ${inventoryDetails?.id === inventory.id ? "border-orange-500" : ""}`}
                >
                  <span className="font-medium">
                    {inventory.status === "draft" ? "Brouillon" : "Validé"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(inventory.created_at).toLocaleString("fr-FR")}
                    {inventory.validated_at
                      ? ` · Validé le ${new Date(inventory.validated_at).toLocaleString("fr-FR")}`
                      : ""}
                  </span>
                </button>
              ))}
              {inventories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun inventaire enregistré.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {inventoryDetails
                  ? `Inventaire · ${inventoryDetails.status === "draft" ? "Brouillon" : "Validé"}`
                  : "Détail de l'inventaire"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!inventoryDetails ? (
                <p className="text-sm text-muted-foreground">Sélectionnez un inventaire.</p>
              ) : inventoryDetails.lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun article en stock lors de la création.</p>
              ) : (
                <>
                  {inventoryDetails.lines.map((line) => {
                    const realQty = Number(inventoryQuantities[line.id] ?? line.real_qty ?? 0);
                    return (
                      <div
                        key={line.id}
                        className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_110px_110px_110px] sm:items-center"
                      >
                        <div>
                          <p className="font-medium">{line.stock_item?.name ?? line.stock_item_id}</p>
                          <p className="text-xs text-muted-foreground">
                            Théorique : {line.theoretical_qty}
                          </p>
                        </div>
                        <Label className="grid gap-1 text-xs">
                          Réel
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={inventoryQuantities[line.id] ?? String(line.real_qty ?? 0)}
                            disabled={inventoryDetails.status !== "draft" || busy}
                            onChange={(event) =>
                              setInventoryQuantities((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                            onBlur={() => {
                              const quantity = Number(inventoryQuantities[line.id] ?? line.real_qty ?? 0);
                              if (!Number.isFinite(quantity) || quantity < 0) return;
                              void updateInventoryLine(line.id, quantity).catch((reason: unknown) =>
                                toast.error(
                                  reason instanceof Error
                                    ? reason.message
                                    : "Impossible d'enregistrer la quantité réelle.",
                                ),
                              );
                            }}
                          />
                        </Label>
                        <div className="text-sm">
                          Écart : {Number.isFinite(realQty) ? realQty - line.theoretical_qty : "—"}
                        </div>
                      </div>
                    );
                  })}
                  {inventoryDetails.status === "draft" ? (
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => setInventoryToValidate(inventoryDetails)}
                    >
                      Valider l'inventaire
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : tab === "stock" ? (
        <div className="space-y-6">
          <StockItemsManager />
          <Card className="card-3d rounded-2xl">
            <CardHeader><CardTitle>Commandes fournisseurs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune commande fournisseur.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                    <div>
                      <p className="font-medium">{order.supplier_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.order_number} · {order.articles?.length ?? 0} article(s) · {order.total_amount} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-slate-700">{order.status}</span>
                      {order.status !== "received" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => prepareReceipt(order)}>
                          Marquer reçue
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Fournisseurs</CardTitle>
              <Button type="button" size="sm" onClick={() => openSupplierDialog()}>
                <Plus className="mr-1 size-4" />
                Nouveau
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={supplierArchived}
                  onChange={(event) => setSupplierArchived(event.target.checked)}
                />
                Afficher les fournisseurs archivés
              </label>
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`rounded-lg border p-3 ${selectedSupplierId === supplier.id ? "border-orange-500" : ""}`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedSupplierId(supplier.id)}
                  >
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {supplier.contact_name || supplier.phone || supplier.email || "Aucun contact"}
                    </p>
                    {supplier.archived_at ? <p className="text-xs text-muted-foreground">Archivé</p> : null}
                  </button>
                  {!supplier.archived_at ? (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openSupplierDialog(supplier)}>
                        <Pencil className="mr-1 size-3" />
                        Modifier
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setSupplierToArchive(supplier)}>
                        <Archive className="mr-1 size-3" />
                        Archiver
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun fournisseur.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" />
                Commandes de {selectedSupplier?.name ?? "ce fournisseur"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orders
                .filter((order) => order.supplier_id === selectedSupplierId)
                .map((order) => (
                  <div key={order.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3">
                    <span>{order.order_number} · {order.created_at ? new Date(order.created_at).toLocaleDateString("fr-FR") : "Date inconnue"}</span>
                    <span>{order.status} · {order.total_amount} FCFA</span>
                  </div>
                ))}
              {!orders.some((order) => order.supplier_id === selectedSupplierId) ? (
                <p className="text-sm text-muted-foreground">Aucune commande enregistrée.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label>Nom *</Label>
            <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
            <Label>Contact</Label>
            <Input value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} />
            <Label>Téléphone</Label>
            <Input value={supplierPhone} onChange={(event) => setSupplierPhone(event.target.value)} />
            <Label>Email</Label>
            <Input type="email" value={supplierEmail} onChange={(event) => setSupplierEmail(event.target.value)} />
            <Label>Notes</Label>
            <Input value={supplierNotes} onChange={(event) => setSupplierNotes(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void saveSupplier()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(supplierToArchive)} onOpenChange={(open) => !open && setSupplierToArchive(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archiver le fournisseur ?</DialogTitle></DialogHeader>
          <p>Les commandes passées resteront consultables.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSupplierToArchive(null)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void confirmArchiveSupplier()}>Archiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouvelle commande fournisseur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Fournisseur</Label>
              <select
                value={orderSupplierId}
                onChange={(event) => setOrderSupplierId(event.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              >
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            {orderLines.map((line, index) => (
              <OrderLineEditor
                key={`${index}-${line.stock_item_id}`}
                shopId={shopId}
                line={line}
                onChange={(updated) =>
                  setOrderLines((current) => current.map((entry, entryIndex) => entryIndex === index ? updated : entry))
                }
                onRemove={() => setOrderLines((current) => current.filter((_, entryIndex) => entryIndex !== index))}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => void addOrderLine()}
            >
              <Plus className="mr-1 size-4" />
              Ajouter un article
            </Button>
            <p className="text-right font-semibold">
              Total estimé : {new Intl.NumberFormat("fr-FR").format(orderTotal)} FCFA
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOrderDialogOpen(false)}>Annuler</Button>
            <Button type="button" disabled={busy || !orderLines.length} onClick={() => void saveOrder()}>
              Créer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(receivingOrder)} onOpenChange={(open) => !open && setReceivingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réceptionner {receivingOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(receivingOrder?.articles ?? []).map((line) => (
              <div key={line.stock_item_id} className="grid gap-2 sm:grid-cols-[1fr_150px] sm:items-center">
                <Label htmlFor={`received-${line.stock_item_id}`}>
                  {line.name} · commandé : {line.quantity}
                </Label>
                <Input
                  id={`received-${line.stock_item_id}`}
                  type="number"
                  min="0"
                  max={line.quantity}
                  step="1"
                  value={receivedQuantities[line.stock_item_id] ?? "0"}
                  onChange={(event) =>
                    setReceivedQuantities((current) => ({
                      ...current,
                      [line.stock_item_id]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReceivingOrder(null)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void submitReceipt()}>Valider la réception</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(inventoryToValidate)}
        onOpenChange={(open) => !open && !busy && setInventoryToValidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider cet inventaire ?</DialogTitle>
          </DialogHeader>
          <p>
            Les écarts seront appliqués au stock et l'inventaire ne pourra plus être modifié.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setInventoryToValidate(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void confirmInventoryValidation()}
            >
              {busy ? "Validation…" : "Confirmer la validation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderLineEditor({
  shopId,
  line,
  onChange,
  onRemove,
}: {
  shopId: string | null;
  line: { stock_item_id: string; quantity: number; unit_price: number };
  onChange: (line: { stock_item_id: string; quantity: number; unit_price: number }) => void;
  onRemove: () => void;
}) {
  const [items, setItems] = useState<StockItem[]>([]);
  useEffect(() => {
    if (!shopId) return;
    void listStockItems(shopId)
      .then(setItems)
      .catch((reason: unknown) =>
        toast.error(reason instanceof Error ? reason.message : "Impossible de charger les articles."),
      );
  }, [shopId]);
  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_100px_130px_auto]">
      <select
        value={line.stock_item_id}
        onChange={(event) => {
          const item = items.find((entry) => entry.id === event.target.value);
          if (item) onChange({ ...line, stock_item_id: item.id, unit_price: item.unit_price });
        }}
        className="h-10 min-w-0 rounded-md border bg-background px-2"
      >
        {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <Input
        type="number"
        min="1"
        step="1"
        aria-label="Quantité commandée"
        value={line.quantity}
        onChange={(event) => onChange({ ...line, quantity: Number(event.target.value) })}
      />
      <Input
        type="number"
        min="0"
        step="1"
        aria-label="Prix unitaire"
        value={line.unit_price}
        onChange={(event) => onChange({ ...line, unit_price: Number(event.target.value) })}
      />
      <Button type="button" variant="outline" onClick={onRemove}>Retirer</Button>
    </div>
  );
}

export function StockItemsManager() {
  const { shopId } = useCurrentShop();
  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<StockItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyItemForm);
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"entry" | "exit">("entry");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("1");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!shopId) return;
    try {
      const [nextItems, nextSuppliers] = await Promise.all([
        listStockItems(shopId, {
          ...(categoryFilter ? { category: categoryFilter } : {}),
          ...(supplierFilter ? { supplier_id: supplierFilter } : {}),
          stock_bas: lowStockOnly,
          archived: showArchived,
        }),
        getSuppliers(shopId),
      ]);
      setItems(nextItems);
      setSuppliers(nextSuppliers);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de charger les articles.");
    }
  }

  useEffect(() => {
    void refresh();
  }, [shopId, categoryFilter, supplierFilter, lowStockOnly, showArchived]);

  function openForm(item?: StockItem) {
    setEditingItem(item ?? null);
    setForm(item ? {
      name: item.name,
      category: item.category ?? "",
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      unit_price: String(item.unit_price),
      supplier_id: item.supplier_id ?? "",
    } : emptyItemForm);
    setFormOpen(true);
  }

  async function saveItem() {
    if (!shopId || !form.name.trim()) {
      toast.error("Le nom de l'article est obligatoire.");
      return;
    }
    const values = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      min_quantity: Number(form.min_quantity),
      unit_price: Number(form.unit_price),
      supplier_id: form.supplier_id || null,
      supplier: suppliers.find((supplier) => supplier.id === form.supplier_id)?.name ?? null,
    };
    if ([values.min_quantity, values.unit_price].some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error("Le prix et le seuil doivent être des nombres positifs ou nuls.");
      return;
    }
    setBusy(true);
    try {
      if (editingItem) {
        await updateStockItem(shopId, editingItem.id, values);
      } else {
        const quantity = Number(form.quantity);
        if (!Number.isFinite(quantity) || quantity < 0) {
          toast.error("Le stock initial doit être un nombre positif ou nul.");
          return;
        }
        await createStockItem(shopId, { ...values, quantity });
      }
      setFormOpen(false);
      await refresh();
      toast.success(editingItem ? "Article modifié." : "Article créé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'enregistrer l'article.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmArchive() {
    if (!shopId || !archiveTarget) return;
    setBusy(true);
    try {
      await archiveStockItem(shopId, archiveTarget.id);
      setArchiveTarget(null);
      await refresh();
      toast.success("Article archivé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'archiver l'article.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAdjustment() {
    const quantity = Number(adjustmentQuantity);
    if (!shopId || !adjustTarget || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Saisissez une quantité positive.");
      return;
    }
    setBusy(true);
    try {
      await adjustStock(
        shopId,
        adjustTarget.id,
        adjustmentType,
        quantity,
        adjustmentReason.trim() || "Ajustement manuel",
      );
      setAdjustTarget(null);
      setAdjustmentQuantity("1");
      setAdjustmentReason("");
      await refresh();
      toast.success("Stock ajusté.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'ajuster le stock.");
    } finally {
      setBusy(false);
    }
  }

  const categories = [...new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Articles en stock</CardTitle>
          <Button type="button" onClick={() => openForm()}>
            <Plus className="mr-2 size-4" />
            Nouvel article
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Label className="grid gap-1">
              Catégorie
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              >
                <option value="">Toutes</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Label>
            <Label className="grid gap-1">
              Fournisseur
              <select
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              >
                <option value="">Tous</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </Label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lowStockOnly} onChange={(event) => setLowStockOnly(event.target.checked)} />
              Stock bas
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
              Articles archivés
            </label>
          </div>
          {items.length ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category ?? "Divers"} · {suppliers.find((supplier) => supplier.id === item.supplier_id)?.name ?? item.supplier ?? "Sans fournisseur"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{item.quantity}</span>
                    {item.quantity <= item.min_quantity ? <span className="text-xs text-amber-700">Stock bas</span> : null}
                    {item.archived_at ? (
                      <span className="text-xs text-muted-foreground">Archivé</span>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => setAdjustTarget(item)}>
                          Ajuster
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => openForm(item)}>
                          <Pencil className="mr-1 size-3" />
                          Modifier
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setArchiveTarget(item)}>
                          <Archive className="mr-1 size-3" />
                          Archiver
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun article correspondant.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="grid gap-1 sm:col-span-2">
              Nom
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Label>
            <Label className="grid gap-1">
              Catégorie
              <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </Label>
            <Label className="grid gap-1">
              Fournisseur
              <select
                value={form.supplier_id}
                onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value }))}
                className="h-10 rounded-md border bg-background px-3"
              >
                <option value="">Aucun</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </Label>
            {!editingItem ? (
              <Label className="grid gap-1">
                Stock initial
                <Input type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
              </Label>
            ) : null}
            <Label className="grid gap-1">
              Seuil d'alerte
              <Input type="number" min="0" step="1" value={form.min_quantity} onChange={(event) => setForm((current) => ({ ...current, min_quantity: event.target.value }))} />
            </Label>
            <Label className="grid gap-1">
              Prix unitaire
              <Input type="number" min="0" step="1" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: event.target.value }))} />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void saveItem()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(adjustTarget)} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster {adjustTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label>
              Type de mouvement
              <select
                value={adjustmentType}
                onChange={(event) => setAdjustmentType(event.target.value as "entry" | "exit")}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="entry">Entrée</option>
                <option value="exit">Sortie</option>
              </select>
            </Label>
            <Label>
              Quantité
              <Input
                type="number"
                min="1"
                step="1"
                value={adjustmentQuantity}
                onChange={(event) => setAdjustmentQuantity(event.target.value)}
              />
            </Label>
            <Label>
              Motif
              <Input value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void submitAdjustment()}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(archiveTarget)} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archiver l'article ?</DialogTitle></DialogHeader>
          <p>{archiveTarget?.name} ne sera plus proposé dans les nouvelles commandes.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setArchiveTarget(null)}>Annuler</Button>
            <Button type="button" disabled={busy} onClick={() => void confirmArchive()}>Archiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
