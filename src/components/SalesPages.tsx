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
} from "lucide-react";

import { toast } from "sonner";

import { PageIdentity } from "@/components/PageIdentity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
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
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySaleId, setBusySaleId] = useState<string | null>(null);
  useEffect(() => {
    if (shopLoading || !shopId) return;
    void listSales(shopId)
      .then(setSales)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Chargement impossible.");
      })
      .finally(() => setLoading(false));
  }, [shopId, shopLoading]);
  const filtered = sales.filter((sale) =>
    view === "orders"
      ? sale.delivery_status !== "delivered"
      : view === "deliveries"
        ? sale.delivery_status === "delivered"
        : true,
  );
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
      <div
        className={`flex flex-wrap items-end justify-between gap-4 rounded-xl border p-5 sm:p-6 ${theme.band}`}
      >
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isOrders ? "Suivi de préparation" : isDeliveries ? "Suivi client" : "Point de vente"}
          </p>
          <PageIdentity
            title={title}
            subtitle={subtitle}
            icon={HeadingIcon}
            iconClassName={theme.icon}
            titleClassName="text-2xl sm:text-3xl"
            subtitleClassName="mt-1 text-muted-foreground"
          />
        </div>
        {view === "all" ? (
          <Button asChild>
            <Link to="/sales/nouveau">➕ Nouvelle vente</Link>
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
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement des ventes…</p> : null}
      {!loading && !shopLoading && !error ? (
        <p className="text-sm text-muted-foreground">{filtered.length} vente(s)</p>
      ) : null}

      <div className="grid gap-3">
        {filtered.map((sale) => (
          <article
            key={sale.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {sale.product_photo_url ? (
                <img
                  src={sale.product_photo_url}
                  alt={sale.product_name}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-md border object-cover"
                />
              ) : (
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-md bg-muted ${theme.metric}`}>
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
                <Badge variant="outline" className="capitalize">
                  {sale.delivery_status === "delivered" ? "✅ Remise" : sale.delivery_status === "ready" ? "📦 Prête" : "⏳ À préparer"}
                </Badge>
                <Badge variant="secondary">
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
        <p className={`rounded-lg border border-dashed p-8 text-center text-muted-foreground ${theme.band}`}>
          {isDeliveries ? "Aucune livraison enregistrée." : isOrders ? "Aucune commande en attente." : "Aucune vente enregistrée."}
        </p>
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon aria-hidden="true" className={`size-5 ${className}`} />
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("⚠️ Sélectionnez un atelier.");
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
        client_id: null,
        client_name: String(form.get("client_name") ?? "") || null,
        client_whatsapp: String(form.get("client_whatsapp") ?? "") || null,
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
      <PageIdentity
        title="➕ Nouvelle vente"
        subtitle="Enregistrez une vente pour l’activité choisie."
        icon={ShoppingCart}
        iconClassName="text-orange-600 dark:text-orange-300"
      />
      <form
        onSubmit={(event) => void submit(event)}
        className="grid gap-4 rounded-lg border bg-card p-6"
      >
        <label className="grid gap-2 text-sm font-medium">
          Activité
          <select
            value={activityType}
            onChange={(event) => setActivityType(event.target.value as ActivityType)}
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="phone">Téléphone</option>
            <option value="computer">Ordinateur</option>
            <option value="consumable">Consommable</option>
          </select>
        </label>
        <Input name="product_name" placeholder="Nom du produit" required />
        <Input name="product_description" placeholder="Description" />
        <label className="grid gap-2 text-sm font-medium">
          Photo du produit
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            className="text-sm"
          />
          {photoFile ? <span className="text-muted-foreground">{photoFile.name}</span> : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            placeholder="Quantité"
            required
          />
          <Input
            name="unit_price"
            type="number"
            min="0"
            placeholder="Prix unitaire (FCFA)"
            required
          />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Mode de paiement
          <select
            name="payment_method"
            defaultValue=""
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="">Non payé</option>
            <option value="cash">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="mtn">MTN</option>
            <option value="moov">Moov</option>
          </select>
        </label>
        <Input name="client_name" placeholder="Nom du client" />
        <Input name="client_whatsapp" placeholder="WhatsApp du client" />
        <Button type="submit">💾 Enregistrer la vente</Button>
      </form>
    </section>
  );
}
