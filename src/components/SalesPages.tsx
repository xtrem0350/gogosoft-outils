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
import { PageIdentity } from "@/components/PageIdentity";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import type { ClientRecord } from "@/services/clientService";
import {
  createSale,
  listSales,
  markAsDelivered,
  type Sale,
  type SalePaymentMethod,
  uploadSalePhoto,
} from "@/services/salesService";
import type { ActivityType } from "@/services/workshopService";

export function SalesListPage({ view = "all" }: { view?: "all" | "orders" | "deliveries" }) {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySaleId, setBusySaleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  useEffect(() => {
    if (shopLoading || !shopId) return;
    void listSales(shopId)
      .then(setSales)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Chargement impossible.");
      })
      .finally(() => setLoading(false));
  }, [shopId, shopLoading]);
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
    return !query || [sale.product_name, sale.client_name ?? ""].some((value) => value.toLocaleLowerCase().includes(query));
  });
  const isOrders = view === "orders";
  const isDeliveries = view === "deliveries";
  const title = isOrders ? "📦 Commandes" : isDeliveries ? "🚚 Livraisons" : "🛒 Ventes";
  const subtitle = isOrders
    ? "Suivez les commandes à préparer et à remettre aux clients."
    : isDeliveries
      ? "Retrouvez les ventes déjà remises aux clients."
      : "Consultez les ventes de votre boutique et leur état de livraison.";
  const HeadingIcon = isOrders ? ClipboardList : isDeliveries ? Truck : CircleDollarSign;
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title.replace(/^\S+\s/, "")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} vente(s) affichée(s)</p>
        </div>
        {view === "all" ? (
          <Button onClick={() => void navigate({ to: "/sales/nouveau" })} className="h-11 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d active:scale-95">
            + Nouvelle vente
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SalesMetric icon={Clock3} label="À préparer" value={pendingCount} className={theme.metric} />
        <SalesMetric icon={Package} label="Prêtes" value={readyCount} className={theme.metric} />
        <SalesMetric icon={Check} label="Remises" value={deliveredCount} className={theme.metric} />
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          ❌ {error}
        </div>
      ) : null}
      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit ou un client" aria-label="Rechercher une vente" className="h-12 rounded-full pl-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer les ventes">
          {[
            ["all", "Toutes"],
            ["pending", "À préparer"],
            ["ready", "Prêtes"],
            ["delivered", "Remises"],
          ].map(([value, label]) => (
            <Button key={value} type="button" size="sm" variant={deliveryFilter === value ? "default" : "outline"} onClick={() => setDeliveryFilter(value)} className={`shrink-0 rounded-full px-4 ${deliveryFilter === value ? "bg-orange-600 text-white hover:bg-orange-700" : ""}`}>
              {label}
            </Button>
          ))}
        </div>
      </div>
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement des ventes…</p> : null}

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
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-muted ${theme.metric}`}>
                  <Package className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{sale.product_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sale.client_name ?? "Client non renseigné"} · {sale.quantity} × {sale.unit_price} FCFA
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(sale.created_at).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-3 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`capitalize ${sale.delivery_status === "delivered" ? "border-green-600 bg-green-600 text-white" : sale.delivery_status === "ready" ? "border-green-200 bg-green-100 text-green-800" : "border-yellow-200 bg-yellow-100 text-yellow-800"}`}>
                  {sale.delivery_status === "delivered" ? "✅ Remise" : sale.delivery_status === "ready" ? "📦 Prête" : "⏳ À préparer"}
                </Badge>
                <Badge variant="secondary" className={sale.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                  {sale.payment_status === "paid" ? "Payée" : sale.payment_status === "refunded" ? "Remboursée" : "À payer"}
                </Badge>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-bold">{sale.total_price.toLocaleString("fr-FR")} FCFA</p>
                {isOrders && sale.delivery_status !== "delivered" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={busySaleId === sale.id}
                    onClick={() => void deliverSale(sale.id)}
                  >
                    <Check aria-hidden="true" /> {busySaleId === sale.id ? "En cours…" : "Marquer remise"}
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
          {...(view === "all" ? { actionLabel: "Nouvelle vente", onAction: () => void navigate({ to: "/sales/nouveau" }) } : {})}
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
  const [activityType, setActivityType] = useState<ActivityType>("phone");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("⚠️ Sélectionnez un atelier.");
      return;
    }
    if (!selectedClient) {
      toast.error("Sélectionnez un client avant d'enregistrer la vente.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get("quantity"));
    const unitPrice = Number(form.get("unit_price"));
    const paymentMethod = String(form.get("payment_method")) as SalePaymentMethod;
    try {
      const photoUrl = photoFile ? await uploadSalePhoto(shopId, photoFile) : null;
      await createSale({
        shop_id: shopId,
        activity_type: activityType,
        product_name: String(form.get("product_name")),
        product_description: String(form.get("product_description") ?? "") || null,
        product_photo_url: photoUrl,
        characteristics: null,
        quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        payment_status: "pending",
        payment_method: paymentMethod || null,
        delivery_status: "pending",
        client_id: selectedClient.id,
        client_name: selectedClient.full_name,
        client_whatsapp: selectedClient.whatsapp,
        notes: null,
      });
      toast.success("✅ Vente enregistrée.");
      await navigate({ to: "/sales" });
    } catch (error) {
      toast.error(`❌ ${error instanceof Error ? error.message : "Création impossible."}`);
    }
  }
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <form onSubmit={(event) => void submit(event)} className="grid gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700"><Package className="size-5" /></span>
              <h2 className="text-lg font-semibold">Produit</h2>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Activité
              <select value={activityType} onChange={(event) => setActivityType(event.target.value as ActivityType)} className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500">
                <option value="phone">Téléphone</option>
                <option value="computer">Ordinateur</option>
                <option value="consumable">Consommable</option>
              </select>
            </label>
            <Input name="product_name" placeholder="Nom du produit" required className="h-12 rounded-xl" />
            <Input name="product_description" placeholder="Description" className="h-12 rounded-xl" />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Photo du produit
              <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} className="rounded-xl border-2 border-slate-200 p-3 text-sm" />
              {photoFile ? <span className="text-xs text-slate-500">{photoFile.name}</span> : null}
            </label>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700"><CircleDollarSign className="size-5" /></span>
              <h2 className="text-lg font-semibold">Quantité et paiement</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="quantity" type="number" min="1" defaultValue="1" placeholder="Quantité" required className="h-12 rounded-xl" />
              <Input name="unit_price" type="number" min="0" placeholder="Prix unitaire (FCFA)" required className="h-12 rounded-xl" />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Mode de paiement
              <select name="payment_method" defaultValue="" className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500">
                <option value="">Non payé</option>
                <option value="cash">Espèces</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="mtn">MTN</option>
                <option value="moov">Moov</option>
              </select>
            </label>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700"><UserRound className="size-5" /></span>
              <h2 className="text-lg font-semibold">Client</h2>
            </div>
            <label className="text-sm font-medium text-slate-700">Client *</label>
            <ClientSelect shopId={shopId} value={selectedClient?.id} selectedClient={selectedClient ?? undefined} onSelect={setSelectedClient} onCreateNew={() => setCreateClientOpen(true)} />
            {selectedClient ? <p className="text-sm text-muted-foreground">WhatsApp : {selectedClient.whatsapp}</p> : null}
          </CardContent>
        </Card>
        <Button type="submit" className="sticky bottom-4 z-10 h-12 w-full rounded-xl bg-ivoirien px-8 font-semibold shadow-3d active:scale-95 sm:justify-self-end">
          Enregistrer la vente
        </Button>
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
