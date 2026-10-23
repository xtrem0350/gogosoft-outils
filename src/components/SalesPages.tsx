import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Clock3,
  Truck,
  ClipboardList,
  CircleDollarSign,
  Package,
  Check,
  UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PageHero } from "@/components/PageHero";
import { PageIdentity } from "@/components/PageIdentity";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { useUserRole } from "@/hooks/useUserRole";
import type { ClientRecord } from "@/services/clientService";
import {
  createSale,
  listSales,
  markAsDelivered,
  updateSale,
  type Sale,
} from "@/services/salesService";
import { getPublicProducts, type OnlineProduct } from "@/services/shopOnlineService";
import { getTodayWorkshopPayments, type ActivityType, type WorkshopPaymentRecord } from "@/services/workshopService";

export function SalesListPage({
  view = "all",
  activityType,
}: {
  view?: "all" | "orders" | "deliveries";
  activityType?: "phone" | "computer";
}) {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { isOwner, isVendeur } = useUserRole();
  const canCreateSales = isOwner || isVendeur;
  const [sales, setSales] = useState<Sale[]>([]);
  const [workshopPayments, setWorkshopPayments] = useState<
    Array<WorkshopPaymentRecord & { ticket_number: string | null; client_name: string | null }>
  >([]);
  const [workshopPaymentsLoading, setWorkshopPaymentsLoading] = useState(false);
  const [workshopPaymentsError, setWorkshopPaymentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySaleId, setBusySaleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  useEffect(() => {
    if (shopLoading || !shopId) return;
    void listSales(shopId, activityType)
      .then(setSales)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Chargement impossible.");
      })
      .finally(() => setLoading(false));
  }, [activityType, shopId, shopLoading]);
  useEffect(() => {
    if (view !== "all" || !isOwner || shopLoading || !shopId) return;
    setWorkshopPaymentsLoading(true);
    void getTodayWorkshopPayments(shopId)
      .then(setWorkshopPayments)
      .catch((reason: unknown) => {
        setWorkshopPaymentsError(
          reason instanceof Error ? reason.message : "Impossible de charger les paiements atelier.",
        );
      })
      .finally(() => setWorkshopPaymentsLoading(false));
  }, [isOwner, shopId, shopLoading, view]);
  const scopedSales = sales.filter((sale) =>
    view === "orders"
      ? sale.delivery_status !== "delivered"
      : view === "deliveries"
        ? sale.delivery_status === "delivered"
        : true,
  );
  const query = search.trim().toLocaleLowerCase();
  const filtered = scopedSales.filter((sale) => {
    if (deliveryFilter !== "all" && sale.delivery_status !== deliveryFilter) return false;
    return (
      !query ||
      [sale.product_name, sale.client_name ?? ""].some((value) =>
        value.toLocaleLowerCase().includes(query),
      )
    );
  });
  const isOrders = view === "orders";
  const isDeliveries = view === "deliveries";
  const activityLabel = activityType === "phone" ? "téléphone" : "ordinateur";
  const title = isOrders
    ? "Commandes"
    : isDeliveries
      ? "Livraisons"
      : activityType
        ? `Ventes ${activityLabel}`
        : "Ventes";
  const subtitle = isOrders
    ? "Suivez les commandes à préparer et à remettre aux clients."
    : isDeliveries
      ? "Retrouvez les ventes déjà remises aux clients."
      : "Consultez les ventes de votre boutique et leur état de livraison.";
  const HeadingIcon = isOrders ? ClipboardList : isDeliveries ? Truck : CircleDollarSign;
  const breadcrumb = isOrders
    ? [{ label: "Accueil", to: "/dashboard" }, { label: "Ventes", to: "/sales" }, { label: "Commandes" }]
    : isDeliveries
      ? [{ label: "Accueil", to: "/dashboard" }, { label: "Ventes", to: "/sales" }, { label: "Livraisons" }]
      : [{ label: "Accueil", to: "/dashboard" }, { label: "Ventes" }];
  const theme = isDeliveries
    ? {
        band: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/25",
        icon: "text-emerald-700 dark:text-emerald-300",
        metric: "text-emerald-700 dark:text-emerald-300",
      }
    : {
        band: "border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/25",
        icon: "text-orange-700 dark:text-orange-300",
        metric: "text-orange-700 dark:text-orange-300",
      };
  const pendingCount = sales.filter((sale) => sale.delivery_status === "pending").length;
  const readyCount = sales.filter((sale) => sale.delivery_status === "ready").length;
  const deliveredCount = sales.filter((sale) => sale.delivery_status === "delivered").length;
  const deliveryOptions: Array<[string, string]> = [
    ["all", "Toutes"],
    ["pending", "À préparer"],
    ["ready", "Prêtes"],
    ["delivered", "Remises"],
  ];

  async function deliverSale(saleId: string) {
    setBusySaleId(saleId);
    try {
      const updated = await markAsDelivered(saleId);
      setSales((current) => current.map((sale) => (sale.id === saleId ? updated : sale)));
      toast.success("✅ Livraison confirmée.");
    } catch (reason) {
      toast.error(`❌ ${reason instanceof Error ? reason.message : "Mise à jour impossible."}`);
    } finally {
      setBusySaleId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title={title}
        subtitle={subtitle}
        icon={HeadingIcon}
        iconColor="orange"
        action={
          view === "all" && canCreateSales ? (
            <Button
              onClick={() => void navigate({ to: "/sales/nouveau" })}
              className="h-11 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d active:scale-95"
            >
              + Nouvelle vente
            </Button>
          ) : undefined
        }
        breadcrumb={breadcrumb}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SalesMetric
          icon={Clock3}
          label="À préparer"
          value={pendingCount}
          className={theme.metric}
        />
        <SalesMetric icon={Package} label="Prêtes" value={readyCount} className={theme.metric} />
        <SalesMetric icon={Check} label="Remises" value={deliveredCount} className={theme.metric} />
      </div>

      {view === "all" && isOwner ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Paiements atelier aujourd'hui</CardTitle>
            <p className="text-lg font-bold text-green-700">
              {new Intl.NumberFormat("fr-FR").format(
                workshopPayments.reduce((total, payment) => total + payment.amount, 0),
              )}{" "}
              FCFA
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {workshopPaymentsError ? (
              <p role="alert" className="text-sm text-destructive">{workshopPaymentsError}</p>
            ) : null}
            {workshopPaymentsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des paiements atelier…</p>
            ) : workshopPayments.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      {["N° fiche", "Client", "Montant", "Mode"].map((label) => (
                        <th key={label} className="px-3 py-2">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workshopPayments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{payment.ticket_number ?? payment.ticket_id}</td>
                        <td className="px-3 py-2">{payment.client_name ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold">
                          {new Intl.NumberFormat("fr-FR").format(payment.amount)} FCFA
                        </td>
                        <td className="px-3 py-2">
                          {{
                            cash: "Espèces",
                            wave: "Wave",
                            orange_money: "Orange Money",
                            mtn: "MTN",
                            moov: "Moov",
                          }[payment.method] ?? payment.method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !workshopPaymentsError ? (
              <p className="text-sm text-muted-foreground">Aucun paiement atelier aujourd'hui.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          ❌ {error}
        </div>
      ) : null}
      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit ou un client"
            aria-label="Rechercher une vente"
            className="h-12 rounded-full pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer les ventes">
          {deliveryOptions.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={deliveryFilter === value ? "default" : "outline"}
              onClick={() => setDeliveryFilter(value ?? "all")}
              className={`shrink-0 rounded-full px-4 ${deliveryFilter === value ? "bg-orange-600 text-white hover:bg-orange-700" : ""}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      {loading || shopLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des ventes…</p>
      ) : null}

      <div className="grid gap-3">
        {filtered.map((sale) => (
          <article
            key={sale.id}
            className="flex min-h-20 flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-3d sm:p-6"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {sale.product_photo_url ? (
                <img
                  src={sale.product_photo_url}
                  alt={sale.product_name}
                  loading="lazy"
                  className="size-12 shrink-0 rounded-full border object-cover"
                />
              ) : (
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-muted ${theme.metric}`}
                >
                  <Package className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{sale.product_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sale.client_name ?? "Client non renseigné"} · {sale.quantity} × {sale.unit_price}{" "}
                  FCFA
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(sale.created_at).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-3 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`capitalize ${sale.delivery_status === "delivered" ? "border-green-600 bg-green-600 text-white" : sale.delivery_status === "ready" ? "border-green-200 bg-green-100 text-green-800" : "border-yellow-200 bg-yellow-100 text-yellow-800"}`}
                >
                  {sale.delivery_status === "delivered"
                    ? "✅ Remise"
                    : sale.delivery_status === "ready"
                      ? "📦 Prête"
                      : "⏳ À préparer"}
                </Badge>
                <Badge
                  variant="secondary"
                  className={
                    sale.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {sale.payment_status === "paid"
                    ? "Payée"
                    : sale.payment_status === "refunded"
                      ? "Remboursée"
                      : "À payer"}
                </Badge>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-bold">
                  {sale.total_price.toLocaleString("fr-FR")} FCFA
                </p>
                {isOrders && sale.delivery_status !== "delivered" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={busySaleId === sale.id}
                    onClick={() => void deliverSale(sale.id)}
                  >
                    <Check aria-hidden="true" />{" "}
                    {busySaleId === sale.id ? "En cours…" : "Marquer remise"}
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && !shopLoading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={HeadingIcon}
          title={isDeliveries ? "Aucune livraison" : isOrders ? "Aucune commande" : "Aucune vente"}
          description={search ? "Modifiez votre recherche ou votre filtre." : subtitle}
          {...(view === "all"
            ? {
                actionLabel: "Nouvelle vente",
                onAction: () => void navigate({ to: "/sales/nouveau" }),
              }
            : {})}
        />
      ) : null}
    </section>
  );
}

function SalesMetric({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Package;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-orange-50">
        <Icon aria-hidden="true" className={`size-5 ${className}`} />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function NewSalePage() {
  const navigate = useNavigate();
  const { shopId } = useCurrentShop();
  const { activeModules } = useActiveModules();
  const { isVendeur, isOwner } = useUserRole();
  const allowedSalesTypes = [
    ...(activeModules.includes("vente-telephone") ? (["phone"] as const) : []),
    ...(activeModules.includes("vente-pc") ? (["computer"] as const) : []),
  ];
  const [activityType, setActivityType] = useState<ActivityType>("phone");
  const [products, setProducts] = useState<OnlineProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<OnlineProduct | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [savedSale, setSavedSale] = useState<Sale | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingToCashier, setSendingToCashier] = useState(false);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setProducts([]);
      setSelectedProduct(null);
      return;
    }
    setProductsLoading(true);
    void getPublicProducts(shopId)
      .then((availableProducts) => {
        if (active) setProducts(availableProducts);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Impossible de charger le catalogue.");
        }
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shopId]);

  useEffect(() => {
    if (allowedSalesTypes.length > 0 && !allowedSalesTypes.includes(activityType as "phone" | "computer")) {
      const firstAllowed = allowedSalesTypes[0];
      if (firstAllowed) setActivityType(firstAllowed);
    }
  }, [activityType, allowedSalesTypes.join(",")]);

  const selectableProducts = products.filter((product) =>
    product.is_available &&
    product.stock > 0 &&
    (product.category === activityType || product.category === "accessory" || product.category === "other"),
  );

  useEffect(() => {
    if (selectedProduct && !selectableProducts.some((product) => product.id === selectedProduct.id)) {
      setSelectedProduct(null);
    }
  }, [activityType, products, selectedProduct]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner && !isVendeur) {
      toast.error("Seul un vendeur peut enregistrer une vente.");
      return;
    }
    if (!shopId) {
      toast.error("⚠️ Sélectionnez un atelier.");
      return;
    }
    if (!selectedProduct) {
      toast.error("Sélectionnez un produit du catalogue.");
      return;
    }
    if (!selectedClient) {
      toast.error("Sélectionnez un client avant d'enregistrer la vente.");
      return;
    }
    const saleQuantity = Number(quantity);
    if (!Number.isInteger(saleQuantity) || saleQuantity < 1 || saleQuantity > selectedProduct.stock) {
      toast.error(`La quantité doit être comprise entre 1 et ${selectedProduct.stock}.`);
      return;
    }
    setSaving(true);
    try {
      const sale = await createSale({
        shop_id: shopId,
        activity_type: activityType,
        product_name: selectedProduct.name,
        product_description: selectedProduct.description,
        product_photo_url: selectedProduct.image_urls[0] ?? null,
        characteristics: typeof selectedProduct.characteristics === "object" && selectedProduct.characteristics !== null && !Array.isArray(selectedProduct.characteristics)
          ? selectedProduct.characteristics as Record<string, unknown>
          : null,
        quantity: saleQuantity,
        unit_price: selectedProduct.price,
        total_price: saleQuantity * selectedProduct.price,
        payment_status: "pending",
        payment_method: null,
        delivery_status: "pending",
        client_id: selectedClient.id,
        client_name: selectedClient.full_name,
        client_whatsapp: selectedClient.whatsapp,
        notes: null,
      });
      setSavedSale(sale);
      toast.success("✅ Vente enregistrée.");
    } catch (error) {
      toast.error(`❌ ${error instanceof Error ? error.message : "Création impossible."}`);
    } finally {
      setSaving(false);
    }
  }

  async function sendToCashier() {
    if (!savedSale) return;
    setSendingToCashier(true);
    try {
      await updateSale(savedSale.id, { payment_status: "awaiting_payment" });
      toast.success("Vente transmise à la caisse pour encaissement.");
      await navigate({ to: "/sales" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de transmettre la vente.");
    } finally {
      setSendingToCashier(false);
    }
  }

  if (!isOwner && !isVendeur) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Cette page est réservée au propriétaire et aux vendeurs.
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHero
        title="Nouvelle vente"
        subtitle="Choisissez un produit du catalogue et transmettez le paiement à la caisse."
        icon={ShoppingCart}
        iconColor="orange"
        breadcrumb={[
          { label: "Accueil", to: "/dashboard" },
          { label: "Ventes", to: "/sales" },
          { label: "Nouvelle vente" },
        ]}
      />
      <form onSubmit={(event) => void submit(event)} className="grid gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <Package className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">Produit</h2>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Activité
              <select
                value={activityType}
                onChange={(event) => setActivityType(event.target.value as ActivityType)}
                className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500"
              >
                {allowedSalesTypes.includes("phone") ? <option value="phone">Téléphone</option> : null}
                {allowedSalesTypes.includes("computer") ? <option value="computer">Ordinateur</option> : null}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Produit du catalogue
              <select
                value={selectedProduct?.id ?? ""}
                onChange={(event) => setSelectedProduct(selectableProducts.find((product) => product.id === event.target.value) ?? null)}
                disabled={productsLoading}
                required
                className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500"
              >
                <option value="">{productsLoading ? "Chargement du catalogue…" : "Sélectionner un produit"}</option>
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.price.toLocaleString("fr-FR")} FCFA · Stock {product.stock}
                  </option>
                ))}
              </select>
            </label>
            {!productsLoading && selectableProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun produit disponible dans le catalogue pour cette activité.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CircleDollarSign className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">Quantité et paiement</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Quantité"
                required
                className="h-12 rounded-xl"
                disabled={!selectedProduct}
              />
              <div className="flex h-12 items-center rounded-xl border-2 bg-muted/30 px-3 font-semibold">
                {selectedProduct
                  ? `${(Number(quantity || 0) * selectedProduct.price).toLocaleString("fr-FR")} FCFA`
                  : "Total à calculer"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Le paiement sera effectué par le caissier.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <UserRound className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">Client</h2>
            </div>
            <label className="text-sm font-medium text-slate-700">Client *</label>
            <ClientSelect
              shopId={shopId}
              value={selectedClient?.id}
              selectedClient={selectedClient ?? undefined}
              onSelect={setSelectedClient}
              onCreateNew={() => setCreateClientOpen(true)}
            />
            {selectedClient ? (
              <p className="text-sm text-muted-foreground">WhatsApp : {selectedClient.whatsapp}</p>
            ) : null}
          </CardContent>
        </Card>
        {!savedSale ? (
          <Button
            type="submit"
            disabled={saving || productsLoading || !selectedProduct || !selectedClient}
            className="sticky bottom-4 z-10 h-12 w-full rounded-xl bg-ivoirien px-8 font-semibold shadow-3d active:scale-95 sm:justify-self-end"
          >
            {saving ? "Enregistrement…" : "Enregistrer la vente"}
          </Button>
        ) : (
          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Vente enregistrée · {savedSale.total_price.toLocaleString("fr-FR")} FCFA · En attente de transmission
            </p>
            <Button type="button" disabled={sendingToCashier} onClick={() => void sendToCashier()}>
              {sendingToCashier ? "Transmission…" : "Envoyer au caissier"}
            </Button>
          </div>
        )}
      </form>
      <QuickCreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        shopId={shopId ?? ""}
        onCreated={setSelectedClient}
      />
    </section>
  );
}
