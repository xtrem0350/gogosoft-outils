import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import {
  createSale,
  listSales,
  type Sale,
  type SalePaymentMethod,
  uploadSalePhoto,
} from "@/services/salesService";
import type { ActivityType } from "@/services/workshopService";

export function SalesListPage({ view = "all" }: { view?: "all" | "orders" | "deliveries" }) {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (shopLoading || !shopId) return;
    void listSales(shopId)
      .then(setSales)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Chargement impossible."),
      )
      .finally(() => setLoading(false));
  }, [shopId, shopLoading]);
  const filtered = sales.filter((sale) =>
    view === "orders"
      ? sale.delivery_status !== "delivered"
      : view === "deliveries"
        ? sale.delivery_status === "delivered"
        : true,
  );
  const title = view === "orders" ? "Commandes" : view === "deliveries" ? "Livraisons" : "Ventes";
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Boutique</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        </div>
        {view === "all" ? (
          <Button asChild>
            <Link to="/sales/nouveau">Nouvelle vente</Link>
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {loading ? "Chargement…" : `${filtered.length} vente(s)`}
      </p>
      <div className="grid gap-3">
        {filtered.map((sale) => (
          <article
            key={sale.id}
            className="flex flex-wrap justify-between gap-3 rounded-md border bg-card p-4"
          >
            <div>
              <h2 className="font-semibold">{sale.product_name}</h2>
              <p className="text-sm text-muted-foreground">
                {sale.client_name ?? "Client non renseigné"} · {sale.quantity} × {sale.unit_price}{" "}
                FCFA
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{sale.total_price} FCFA</p>
              <p className="text-sm text-muted-foreground">
                {sale.delivery_status === "delivered" ? "Livrée" : "En attente"}
              </p>
            </div>
          </article>
        ))}
      </div>
      {!loading && filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Aucune vente.
        </p>
      ) : null}
    </section>
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
      toast.error("Sélectionnez un atelier.");
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
      toast.success("Vente enregistrée.");
      await navigate({ to: "/sales" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible.");
    }
  }
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Ventes</p>
        <h1 className="mt-2 text-3xl font-bold">Nouvelle vente</h1>
      </div>
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
        <Button type="submit">Enregistrer la vente</Button>
      </form>
    </section>
  );
}
