import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import {
  deleteShopProduct,
  getShopOrder,
  isCurrentUserShopOwner,
  listShopOrders,
  listShopProducts,
  saveShopProduct,
  updateOnlineShopSettings,
  updateShopOrder,
  uploadShopAsset,
  type DeliveryStatus,
  type OnlineOrder,
  type OnlineOrderItem,
  type OnlineProduct,
  type OnlineShopSettings,
  type PaymentStatus,
  type ProductCategory,
  type ProductInput,
} from "@/services/shopOnlineService";
import type { Shop } from "@/services/shopService";
import type { Json } from "@/integrations/supabase/types";

const categories: Array<{ value: ProductCategory; label: string }> = [
  { value: "phone", label: "Téléphone" },
  { value: "computer", label: "Ordinateur" },
  { value: "accessory", label: "Accessoire" },
  { value: "consumable", label: "Consommable" },
  { value: "other", label: "Autre" },
];
const deliveryStatuses: DeliveryStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "delivered",
  "cancelled",
];
const paymentStatuses: PaymentStatus[] = ["pending", "paid", "refunded", "failed"];
const deliveryLabels: Record<DeliveryStatus, string> = {
  pending: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};
const paymentLabels: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payée",
  refunded: "Remboursée",
  failed: "Échouée",
};

function formatPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function OwnerGate({ children }: { children: (shop: Shop) => ReactNode }) {
  const { shop, loading: shopLoading } = useCurrentShop();
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const shopId = shop?.id;
  const userId = user?.id;

  useEffect(() => {
    if (!shopId || !userId) {
      setIsOwner(false);
      return;
    }
    let active = true;
    setIsOwner(null);
    void isCurrentUserShopOwner(shopId)
      .then((result) => {
        if (active) setIsOwner(result);
      })
      .catch(() => {
        if (active) setIsOwner(false);
      });
    return () => {
      active = false;
    };
  }, [shopId, userId]);

  if (shopLoading || authLoading || (shop && user && isOwner === null))
    return <p className="p-8 text-sm text-muted-foreground">Vérification du propriétaire…</p>;
  if (!shop || !user || !isOwner) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
      >
        Cette page est réservée au propriétaire de l'atelier actif.
      </div>
    );
  }
  return children(shop);
}

export function OnlineShopSettingsPage() {
  return <OwnerGate>{(shop) => <ShopSettingsForm key={shop.id} shop={shop} />}</OwnerGate>;
}

function ShopSettingsForm({ shop }: { shop: Shop }) {
  const { user } = useAuth();
  const { refresh } = useCurrentShop();
  const [settings, setSettings] = useState<OnlineShopSettings>(() => ({
    name: shop.name,
    is_online_shop: shop.is_online_shop ?? false,
    shop_slug: shop.shop_slug ?? "",
    shop_logo_url: shop.shop_logo_url ?? "",
    shop_description: shop.shop_description ?? "",
    shop_banner_url: shop.shop_banner_url ?? "",
    shop_phone: shop.shop_phone ?? shop.phone ?? "",
    shop_address: shop.shop_address ?? shop.address ?? "",
    shop_whatsapp: shop.shop_whatsapp ?? "",
    accepts_wave: shop.accepts_wave ?? true,
    accepts_orange_money: shop.accepts_orange_money ?? true,
    accepts_mtn: shop.accepts_mtn ?? false,
    accepts_moov: shop.accepts_moov ?? false,
    accepts_cash_on_pickup: shop.accepts_cash_on_pickup ?? true,
    accepts_cash_on_delivery: shop.accepts_cash_on_delivery ?? false,
    delivery_fee: shop.delivery_fee ?? 0,
    delivery_available: shop.delivery_available ?? false,
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  function change<K extends keyof OnlineShopSettings>(key: K, value: OnlineShopSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function uploadAsset(
    event: React.ChangeEvent<HTMLInputElement>,
    key: "shop_logo_url" | "shop_banner_url",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(key);
    try {
      change(key, await uploadShopAsset(shop.id, file));
      toast.success("Image téléversée.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Upload impossible.");
    } finally {
      setUploading(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = String(settings.shop_slug ?? "")
      .trim()
      .toLowerCase();
    if (settings.is_online_shop && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast.error("Saisissez un slug composé de lettres minuscules, chiffres et tirets.");
      return;
    }
    setSaving(true);
    try {
      await updateOnlineShopSettings(shop.id, { ...settings, shop_slug: slug || null });
      await refresh(user?.id, true);
      toast.success("Configuration de la boutique enregistrée.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const paymentToggles: Array<[keyof OnlineShopSettings, string]> = [
    ["accepts_wave", "Wave"],
    ["accepts_orange_money", "Orange Money"],
    ["accepts_mtn", "MTN Mobile Money"],
    ["accepts_moov", "Moov Money"],
    ["accepts_cash_on_pickup", "Espèces au retrait"],
    ["accepts_cash_on_delivery", "Espèces à la livraison"],
  ];
  const publicUrl = `${typeof window === "undefined" ? "https://gogosoft-outils.vercel.app" : window.location.origin}/shop/${settings.shop_slug || "votre-boutique"}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title="Ma boutique en ligne"
        subtitle="Configurez votre vitrine et les options de commande."
        icon={Store}
        iconColor="orange"
      />
      <form onSubmit={(event) => void save(event)} className="space-y-5">
        <Card className="card-3d rounded-lg">
          <CardContent className="grid gap-5 p-5 sm:p-6">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <span>
                <span className="block font-semibold">Activer ma boutique en ligne</span>
                <span className="mt-1 block text-sm text-slate-600">
                  La vitrine publique sera accessible avec son URL.
                </span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(settings.is_online_shop)}
                onChange={(event) => change("is_online_shop", event.target.checked)}
                className="size-5 accent-orange-600"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Nom de la boutique
              <Input
                value={String(settings.name ?? shop.name)}
                onChange={(event) => change("name", event.target.value)}
                required
                maxLength={100}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Slug public
              <Input
                value={String(settings.shop_slug ?? "")}
                onChange={(event) =>
                  change(
                    "shop_slug",
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  )
                }
                placeholder="kalou-services"
                maxLength={60}
              />
            </label>
            <p className="-mt-3 break-all text-sm text-slate-600">
              URL publique :{" "}
              <a
                className="font-semibold text-orange-700 underline"
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                {publicUrl}
              </a>
            </p>
            <label className="grid gap-2 text-sm font-semibold">
              Description
              <textarea
                value={String(settings.shop_description ?? "")}
                onChange={(event) => change("shop_description", event.target.value)}
                rows={4}
                maxLength={1000}
                className="rounded-md border border-slate-300 bg-white p-3 font-normal"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Téléphone
                <Input
                  value={String(settings.shop_phone ?? "")}
                  onChange={(event) => change("shop_phone", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                WhatsApp
                <Input
                  value={String(settings.shop_whatsapp ?? "")}
                  onChange={(event) => change("shop_whatsapp", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                Adresse
                <Input
                  value={String(settings.shop_address ?? "")}
                  onChange={(event) => change("shop_address", event.target.value)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {(
              [
                ["shop_logo_url", "Logo"],
                ["shop_banner_url", "Bannière"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm font-semibold">
                {label}
                {settings[key] ? (
                  <img
                    src={String(settings[key])}
                    alt={`Aperçu ${label.toLowerCase()}`}
                    className="h-32 w-full rounded-md border object-cover"
                  />
                ) : (
                  <span className="grid h-32 place-items-center rounded-md border border-dashed text-slate-400">
                    <ImagePlus className="size-7" />
                  </span>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void uploadAsset(event, key)}
                  disabled={uploading === key}
                />
                {uploading === key ? <span className="text-xs text-slate-500">Upload…</span> : null}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold">Paiements acceptés</h2>
              <p className="mt-1 text-sm text-slate-500">
                Les paiements Mobile Money ne sont pas débités par la vitrine dans cette version.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentToggles.map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm font-medium"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key])}
                    onChange={(event) => change(key, event.target.checked)}
                    className="size-5 accent-orange-600"
                  />
                </label>
              ))}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm font-medium">
              Livraison disponible
              <input
                type="checkbox"
                checked={Boolean(settings.delivery_available)}
                onChange={(event) => change("delivery_available", event.target.checked)}
                className="size-5 accent-emerald-700"
              />
            </label>
            <label className="grid max-w-sm gap-2 text-sm font-semibold">
              Frais de livraison (FCFA)
              <Input
                type="number"
                min="0"
                step="1"
                value={Number(settings.delivery_fee ?? 0)}
                onChange={(event) => change("delivery_fee", Number(event.target.value))}
              />
            </label>
          </CardContent>
        </Card>
        <Button
          type="submit"
          disabled={saving || uploading !== null}
          className="bg-ivoirien px-6 font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}

export function OnlineProductsPage() {
  return <OwnerGate>{(shop) => <ProductsList shop={shop} />}</OwnerGate>;
}

function ProductsList({ shop }: { shop: Shop }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<OnlineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await listShopProducts(shop.id));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [shop.id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(product: OnlineProduct, field: "is_available" | "is_featured") {
    try {
      await saveShopProduct(
        shop.id,
        {
          name: product.name,
          description: product.description,
          category: product.category as ProductCategory,
          price: product.price,
          stock: product.stock,
          image_urls: product.image_urls,
          characteristics: product.characteristics,
          is_available: field === "is_available" ? !product.is_available : product.is_available,
          is_featured: field === "is_featured" ? !product.is_featured : product.is_featured,
        },
        product.id,
      );
      await load();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Mise à jour impossible.");
    }
  }

  async function remove(product: OnlineProduct) {
    if (!window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) return;
    try {
      await deleteShopProduct(shop.id, product.id);
      await load();
      toast.success("Produit supprimé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Suppression impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Produits de la boutique"
        subtitle="Gérez les produits visibles dans votre vitrine."
        icon={Package}
        iconColor="orange"
        action={
          <Button
            onClick={() => void navigate({ to: "/admin/boutique/produits/nouveau" })}
            className="bg-ivoirien text-white"
          >
            <Plus className="size-4" /> Ajouter un produit
          </Button>
        }
      />
      {error ? (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">Chargement des produits…</p> : null}
      {!loading && products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-600">
            Aucun produit dans votre catalogue.
            <div>
              <Button
                className="mt-4 bg-ivoirien text-white"
                onClick={() => void navigate({ to: "/admin/boutique/produits/nouveau" })}
              >
                Créer un produit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-slate-100">
              {product.image_urls[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-slate-400">
                  <Package className="size-9" />
                </div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{product.name}</h2>
                  <p className="mt-1 font-bold text-orange-700">{formatPrice(product.price)}</p>
                </div>
                <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                  {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={product.is_available ? "default" : "outline"}>
                  {product.is_available ? "Disponible" : "Masqué"}
                </Badge>
                {product.is_featured ? <Badge className="bg-emerald-700">À la une</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void navigate({
                      to: "/admin/boutique/produits/$id",
                      params: { id: product.id },
                    })
                  }
                >
                  <Pencil className="size-4" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void toggle(product, "is_available")}
                >
                  {product.is_available ? "Masquer" : "Activer"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void toggle(product, "is_featured")}
                >
                  {product.is_featured ? "Retirer la une" : "Mettre à la une"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer ${product.name}`}
                  onClick={() => void remove(product)}
                >
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const blankProduct: ProductInput = {
  name: "",
  description: "",
  category: "phone",
  price: 0,
  stock: 0,
  image_urls: [],
  characteristics: {},
  is_available: true,
  is_featured: false,
};

export function OnlineProductEditorPage({ productId }: { productId?: string }) {
  return (
    <OwnerGate>
      {(shop) => (
        <ProductEditor
          key={`${shop.id}-${productId ?? "new"}`}
          shop={shop}
          {...(productId ? { productId } : {})}
        />
      )}
    </OwnerGate>
  );
}

function ProductEditor({ shop, productId }: { shop: Shop; productId?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductInput>(blankProduct);
  const [characteristicsText, setCharacteristicsText] = useState("{}");
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    void listShopProducts(shop.id)
      .then((products) => {
        const product = products.find((item) => item.id === productId);
        if (!product) throw new Error("Produit introuvable.");
        if (active) {
          setForm({
            name: product.name,
            description: product.description,
            category: product.category as ProductCategory,
            price: product.price,
            stock: product.stock,
            image_urls: product.image_urls,
            characteristics: product.characteristics,
            is_available: product.is_available,
            is_featured: product.is_featured,
          });
          setCharacteristicsText(JSON.stringify(product.characteristics, null, 2));
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Produit introuvable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId, shop.id]);

  function change<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let characteristics: Json;
    try {
      const parsed: unknown = JSON.parse(characteristicsText);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
        throw new Error("Les caractéristiques doivent être un objet JSON.");
      characteristics = parsed as Json;
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "JSON invalide.");
      return;
    }
    setSaving(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map((photo) => uploadShopAsset(shop.id, photo)),
      );
      await saveShopProduct(
        shop.id,
        {
          ...form,
          characteristics,
          image_urls: [...form.image_urls, ...uploadedPhotos].slice(0, 5),
        },
        productId,
      );
      toast.success(productId ? "Produit modifié." : "Produit ajouté.");
      await navigate({ to: "/admin/boutique/produits" });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-muted-foreground">Chargement du produit…</p>;
  if (error)
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {error}
      </p>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/admin/boutique/produits"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft className="size-4" /> Produits
      </Link>
      <PageHero
        title={productId ? "Modifier le produit" : "Ajouter un produit"}
        subtitle="Les informations et photos seront visibles dans la vitrine selon sa disponibilité."
        icon={Package}
        iconColor="orange"
      />
      <form
        onSubmit={(event) => void save(event)}
        className="grid gap-5 rounded-lg border bg-white p-5 shadow-sm sm:p-6"
      >
        <label className="grid gap-2 text-sm font-semibold">
          Nom du produit
          <Input
            required
            maxLength={120}
            value={form.name}
            onChange={(event) => change("name", event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Description
          <textarea
            rows={4}
            maxLength={3000}
            value={form.description ?? ""}
            onChange={(event) => change("description", event.target.value)}
            className="rounded-md border border-slate-300 p-3 font-normal"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Catégorie
            <select
              value={form.category}
              onChange={(event) => change("category", event.target.value as ProductCategory)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Prix (FCFA)
            <Input
              type="number"
              min="0"
              step="1"
              required
              value={form.price}
              onChange={(event) => change("price", Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Stock
            <Input
              type="number"
              min="0"
              step="1"
              required
              value={form.stock}
              onChange={(event) => change("stock", Number(event.target.value))}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Photos (5 maximum)
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) =>
              setPhotos(
                Array.from(event.target.files ?? []).slice(
                  0,
                  Math.max(0, 5 - form.image_urls.length),
                ),
              )
            }
          />
        </label>
        {form.image_urls.length || photos.length ? (
          <div className="flex flex-wrap gap-3">
            {form.image_urls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="Photo du produit" className="size-20 rounded-md object-cover" />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  onClick={() =>
                    change(
                      "image_urls",
                      form.image_urls.filter((image) => image !== url),
                    )
                  }
                  className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-red-700 text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.map((photo) => (
              <span
                key={`${photo.name}-${photo.size}`}
                className="rounded border px-2 py-1 text-xs"
              >
                {photo.name}
              </span>
            ))}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold">
          Caractéristiques (JSON)
          <textarea
            rows={6}
            value={characteristicsText}
            onChange={(event) => setCharacteristicsText(event.target.value)}
            className="rounded-md border border-slate-300 p-3 font-mono text-sm"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(event) => change("is_available", event.target.checked)}
              className="size-4 accent-orange-600"
            />{" "}
            Disponible dans la vitrine
          </label>
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) => change("is_featured", event.target.checked)}
              className="size-4 accent-emerald-700"
            />{" "}
            Mettre à la une
          </label>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-ivoirien font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
        >
          {saving ? "Enregistrement…" : "Enregistrer le produit"}
        </Button>
      </form>
    </div>
  );
}

export function OnlineOrdersPage() {
  return <OwnerGate>{(shop) => <OrdersList shop={shop} />}</OwnerGate>;
}

function OrdersList({ shop }: { shop: Shop }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Array<OnlineOrder & { order_items: OnlineOrderItem[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listShopOrders(shop.id)
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Chargement impossible.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shop.id]);

  const filtered = orders.filter(
    (order) =>
      (deliveryFilter === "all" || order.delivery_status === deliveryFilter) &&
      (paymentFilter === "all" || order.payment_status === paymentFilter),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Commandes boutique"
        subtitle="Consultez les commandes reçues depuis la vitrine."
        icon={Package}
        iconColor="orange"
      />
      <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Livraison
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
            className="h-10 rounded-md border bg-white px-3"
          >
            <option value="all">Tous les statuts</option>
            {deliveryStatuses.map((status) => (
              <option key={status} value={status}>
                {deliveryLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Paiement
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="h-10 rounded-md border bg-white px-3"
          >
            <option value="all">Tous les statuts</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {paymentLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">Chargement des commandes…</p> : null}
      {!loading && filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-slate-500">
          Aucune commande pour ces filtres.
        </p>
      ) : null}
      <div className="space-y-3">
        {filtered.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() =>
              void navigate({
                to: "/admin/boutique/commandes/$id",
                params: { id: order.id },
              })
            }
            className="grid w-full gap-3 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-orange-300 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <span>
              <span className="block font-bold">
                {order.order_number} · {order.client_name}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {new Date(order.created_at).toLocaleString("fr-FR")} · {order.order_items.length}{" "}
                article(s)
              </span>
            </span>
            <span className="flex flex-wrap gap-2">
              <Badge>
                {deliveryLabels[order.delivery_status as DeliveryStatus] ?? order.delivery_status}
              </Badge>
              <Badge variant="secondary">
                {paymentLabels[order.payment_status as PaymentStatus] ?? order.payment_status}
              </Badge>
            </span>
            <span className="text-right font-bold">{formatPrice(order.total)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function OnlineOrderDetailPage({ orderId }: { orderId: string }) {
  return <OwnerGate>{(shop) => <OrderDetail shop={shop} orderId={orderId} />}</OwnerGate>;
}

function OrderDetail({ shop, orderId }: { shop: Shop; orderId: string }) {
  const [order, setOrder] = useState<(OnlineOrder & { order_items: OnlineOrderItem[] }) | null>(
    null,
  );
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getShopOrder(shop.id, orderId);
      setOrder(result);
      if (result) {
        setDeliveryStatus(result.delivery_status as DeliveryStatus);
        setPaymentStatus(result.payment_status as PaymentStatus);
      }
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Commande introuvable.");
    } finally {
      setLoading(false);
    }
  }, [orderId, shop.id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus() {
    if (!order) return;
    setSaving(true);
    try {
      await updateShopOrder(order.id, deliveryStatus, paymentStatus);
      await load();
      toast.success("Statut de commande mis à jour.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="p-8 text-sm text-muted-foreground">Chargement de la commande…</p>;
  if (error || !order)
    return (
      <div role="alert" className="p-8 text-sm text-destructive">
        {error ?? "Commande introuvable."}
      </div>
    );
  const whatsapp = order.client_whatsapp.replace(/\D/g, "");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/admin/boutique/commandes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft className="size-4" /> Toutes les commandes
      </Link>
      <PageHero
        title={order.order_number}
        subtitle={`Commande de ${order.client_name} · ${new Date(order.created_at).toLocaleString("fr-FR")}`}
        icon={Package}
        iconColor="orange"
      />
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-bold">Articles</h2>
          <div className="mt-4 divide-y">
            {order.order_items.map(
              (item: {
                id: string;
                product_image_url: string | null;
                product_name: string;
                quantity: number;
                unit_price: number;
                total: number;
              }) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt=""
                      className="size-14 rounded object-cover"
                    />
                  ) : (
                    <span className="grid size-14 place-items-center rounded bg-slate-100">
                      <Package className="size-5 text-slate-500" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.product_name}</p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(item.total)}</p>
                </div>
              ),
            )}
          </div>
          <div className="ml-auto mt-4 max-w-xs space-y-2 border-t pt-4 text-sm">
            <p className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </p>
            <p className="flex justify-between">
              <span>Livraison</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </p>
            <p className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </p>
          </div>
        </section>
        <aside className="space-y-5 rounded-lg border bg-white p-5">
          <section>
            <h2 className="font-bold">Client</h2>
            <p className="mt-2">{order.client_name}</p>
            <p className="text-sm text-slate-600">{order.client_whatsapp}</p>
            {order.client_address ? (
              <p className="mt-1 text-sm text-slate-600">{order.client_address}</p>
            ) : null}
            {order.client_notes ? (
              <p className="mt-3 rounded bg-slate-50 p-3 text-sm">Note : {order.client_notes}</p>
            ) : null}
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
            >
              <ExternalLink className="size-4" /> WhatsApp
            </a>
          </section>
          <label className="grid gap-1 text-sm font-semibold">
            Statut livraison
            <select
              value={deliveryStatus}
              onChange={(event) => setDeliveryStatus(event.target.value as DeliveryStatus)}
              className="h-10 rounded-md border bg-white px-2"
            >
              {deliveryStatuses.map((status) => (
                <option key={status} value={status}>
                  {deliveryLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Statut paiement
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
              className="h-10 rounded-md border bg-white px-2"
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {paymentLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void saveStatus()}
            className="w-full bg-ivoirien text-white"
          >
            {saving ? "Mise à jour…" : "Enregistrer les statuts"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => window.print()}>
            Imprimer le reçu
          </Button>
        </aside>
      </div>
    </div>
  );
}
