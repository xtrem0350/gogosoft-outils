import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import brandLogo from "@/assets/images/leprofile.png";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPublicOrder,
  getProductById,
  getPublicOrder,
  getPublicProducts,
  getShopBySlug,
  type OnlineProduct,
  type OnlineShop,
  type OrderPaymentMethod,
  type ProductCategory,
  type PublicOrderDetail,
} from "@/services/shopOnlineService";

const categoryOptions: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "phone", label: "Téléphones" },
  { value: "computer", label: "Ordinateurs" },
  { value: "accessory", label: "Accessoires" },
  { value: "consumable", label: "Consommables" },
  { value: "other", label: "Autres" },
];

const paymentLabels: Record<OrderPaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  cash_on_delivery: "Espèces à la livraison",
  cash_on_pickup: "Espèces au retrait",
};

function money(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function useOnlineShop(slug: string) {
  const [shop, setShop] = useState<OnlineShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getShopBySlug(slug)
      .then((result) => {
        if (active) setShop(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Boutique indisponible.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return { shop, loading, error };
}

function ShopHeader({ shop }: { shop: OnlineShop }) {
  const { itemCount } = useCart(shop.id);
  return (
    <header className="border-b border-orange-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to={`/shop/${shop.shop_slug}` as any} className="flex min-w-0 items-center gap-3">
          {shop.shop_logo_url ? (
            <img src={shop.shop_logo_url} alt="" className="size-11 rounded-lg object-cover" />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <Store className="size-5" />
            </span>
          )}
          <span className="truncate font-display text-base font-bold text-slate-900 sm:text-lg">
            {shop.name}
          </span>
        </Link>
        <Link
          to={`/shop/${shop.shop_slug}/panier` as any}
          className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-800 transition hover:border-orange-400 hover:bg-orange-50"
          aria-label={`Panier, ${itemCount} article(s)`}
        >
          <ShoppingBag className="size-5" />
          {itemCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-ivoirien px-1 text-xs font-bold text-white">
              {itemCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

function ShopFrame({ shop, children }: { shop: OnlineShop; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <ShopHeader shop={shop} />
      {children}
      <footer className="mt-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-slate-600 sm:px-6">
          <p>
            {shop.name}
            {shop.shop_address ? ` · ${shop.shop_address}` : ""}
          </p>
          <a href="/" className="inline-flex items-center gap-2 font-semibold text-slate-800">
            <img src={brandLogo} alt="GogoSoft" className="size-6 rounded object-cover" />
            Boutique propulsée par GogoSoft
          </a>
        </div>
      </footer>
    </div>
  );
}

function PublicState({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase text-orange-700">
          {loading ? "Chargement" : "Boutique"}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{message}</h1>
        {!loading ? (
          <a href="/" className="mt-5 inline-flex items-center gap-2 font-semibold text-orange-700">
            <ArrowLeft className="size-4" /> Retour à GogoSoft
          </a>
        ) : null}
      </div>
    </main>
  );
}

function ProductCard({ shop, product }: { shop: OnlineShop; product: OnlineProduct }) {
  const { addItem } = useCart(shop.id);
  function addToCart() {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_urls[0] ?? null,
    });
    toast.success(`${product.name} ajouté au panier.`);
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
      <Link to={`/shop/${shop.shop_slug}/produit/${product.id}` as any} className="block">
        <div className="relative aspect-[4/3] bg-slate-100">
          {product.image_urls[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid size-full place-items-center text-slate-400">
              <ShoppingBag className="size-9" />
            </div>
          )}
          {product.is_featured ? (
            <span className="absolute left-3 top-3 rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">
              À la une
            </span>
          ) : null}
        </div>
        <div className="p-4">
          <h2 className="truncate font-semibold text-slate-900">{product.name}</h2>
          <p className="mt-1 text-lg font-bold text-orange-700">{money(product.price)}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button
          type="button"
          disabled={product.stock < 1}
          onClick={addToCart}
          className="w-full bg-ivoirien font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
        >
          {product.stock < 1 ? (
            "Rupture de stock"
          ) : (
            <>
              <Plus className="size-4" /> Ajouter au panier
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

export function PublicShopPage({ slug }: { slug: string }) {
  const { shop, loading, error } = useOnlineShop(slug);
  const [products, setProducts] = useState<OnlineProduct[]>([]);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;
    let active = true;
    setProductsLoading(true);
    setProductsError(null);
    void getPublicProducts(shop.id, {
      ...(category === "all" ? {} : { category }),
      ...(search ? { search } : {}),
    })
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setProductsError(reason instanceof Error ? reason.message : "Catalogue indisponible.");
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, search, shop]);

  if (loading) return <PublicState message="Chargement de la boutique…" loading />;
  if (error || !shop)
    return <PublicState message={error ?? "Cette boutique n'existe pas ou n'est pas publiée."} />;

  const whatsapp = shop.shop_whatsapp?.replace(/\D/g, "");
  return (
    <ShopFrame shop={shop}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative flex min-h-56 items-end overflow-hidden rounded-lg bg-slate-900 p-6 text-white sm:min-h-72 sm:p-10">
          {shop.shop_banner_url ? (
            <img
              src={shop.shop_banner_url}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase text-orange-200">Boutique en ligne</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{shop.name}</h1>
            {shop.shop_description ? (
              <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">
                {shop.shop_description}
              </p>
            ) : null}
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
              >
                Contacter sur WhatsApp
              </a>
            ) : null}
          </div>
        </section>

        <section className="mt-8" aria-label="Catalogue produits">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-orange-700">Catalogue</p>
              <h2 className="mt-1 text-2xl font-bold">Nos produits</h2>
            </div>
            <label className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un produit"
                className="h-11 rounded-lg pl-10"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Catégories">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={category === option.value}
                onClick={() => setCategory(option.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === option.value ? "border-orange-700 bg-orange-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-orange-500"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {productsError ? (
            <p
              role="alert"
              className="mt-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {productsError}
            </p>
          ) : null}
          {productsLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">Chargement des produits…</p>
          ) : null}
          {!productsLoading && products.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              Aucun produit disponible pour cette recherche.
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} shop={shop} product={product} />
            ))}
          </div>
        </section>
      </main>
    </ShopFrame>
  );
}

export function PublicProductPage({ slug, productId }: { slug: string; productId: string }) {
  const { shop, loading, error } = useOnlineShop(slug);
  const [product, setProduct] = useState<OnlineProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const { addItem } = useCart(shop?.id ?? "");

  useEffect(() => {
    if (!shop) return;
    let active = true;
    setProductLoading(true);
    void getProductById(productId, shop.id)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setProductError(reason instanceof Error ? reason.message : "Produit indisponible.");
      })
      .finally(() => {
        if (active) setProductLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId, shop]);

  if (loading || productLoading) return <PublicState message="Chargement du produit…" loading />;
  if (error || !shop) return <PublicState message={error ?? "Boutique introuvable."} />;
  if (productError || !product)
    return (
      <ShopFrame shop={shop}>
        <PublicState message={productError ?? "Produit introuvable."} />
      </ShopFrame>
    );

  const selectedProduct = product;
  const contactNumber = shop.shop_whatsapp?.replace(/\D/g, "");
  function addToCart() {
    addItem({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: 1,
      image_url: selectedProduct.image_urls[0] ?? null,
    });
    toast.success("Produit ajouté au panier.");
  }
  const characteristics =
    product.characteristics &&
    typeof product.characteristics === "object" &&
    !Array.isArray(product.characteristics)
      ? Object.entries(product.characteristics)
      : [];

  return (
    <ShopFrame shop={shop}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to={`/shop/${slug}` as any}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700"
        >
          <ArrowLeft className="size-4" /> Retour au catalogue
        </Link>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
            {product.image_urls[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-slate-400">
                <ShoppingBag className="size-12" />
              </div>
            )}
          </div>
          <section className="flex flex-col items-start">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              {categoryOptions.find((item) => item.value === product.category)?.label ?? "Produit"}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-2xl font-bold text-orange-700">{money(product.price)}</p>
            {product.description ? (
              <p className="mt-5 whitespace-pre-line leading-relaxed text-slate-600">
                {product.description}
              </p>
            ) : null}
            {characteristics.length > 0 ? (
              <dl className="mt-6 grid w-full grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200 py-4 text-sm">
                {characteristics.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="mt-1 font-semibold">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="mt-5 text-sm text-slate-500">
              {product.stock > 0 ? `${product.stock} disponible(s)` : "Rupture de stock"}
            </p>
            <Button
              type="button"
              disabled={product.stock < 1}
              onClick={addToCart}
              className="mt-5 h-11 bg-ivoirien px-5 font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
            >
              <Plus className="size-4" /> Ajouter au panier
            </Button>
            {contactNumber ? (
              <a
                href={`https://wa.me/${contactNumber}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par ${product.name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-11 items-center rounded-lg border border-emerald-700 px-5 font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Contacter la boutique par WhatsApp
              </a>
            ) : null}
          </section>
        </div>
      </main>
    </ShopFrame>
  );
}

export function PublicCartPage({ slug }: { slug: string }) {
  const { shop, loading, error } = useOnlineShop(slug);
  const navigate = useNavigate();
  const cart = useCart(shop?.id ?? "");
  if (loading) return <PublicState message="Chargement du panier…" loading />;
  if (error || !shop) return <PublicState message={error ?? "Boutique introuvable."} />;

  return (
    <ShopFrame shop={shop}>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          to={`/shop/${slug}` as any}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700"
        >
          <ArrowLeft className="size-4" /> Continuer les achats
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Votre panier</h1>
        {cart.items.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <ShoppingBag className="mx-auto size-9 text-orange-600" />
            <p className="mt-3 font-semibold">Votre panier est vide</p>
            <Button
              className="mt-5 bg-ivoirien text-white"
              onClick={() => void navigate({ to: `/shop/${slug}` as any })}
            >
              Découvrir les produits
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {cart.items.map((item) => (
                <article key={item.product_id} className="flex flex-wrap items-center gap-4 py-4">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="size-20 rounded-lg bg-slate-100 object-cover"
                    />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-lg bg-slate-100 text-slate-400">
                      <ShoppingBag className="size-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{item.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{money(item.price)} l'unité</p>
                  </div>
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button
                      type="button"
                      aria-label={`Réduire ${item.name}`}
                      onClick={() =>
                        cart.updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                      }
                      className="grid size-9 place-items-center"
                    >
                      <Minus className="size-4" />
                    </button>
                    <Input
                      aria-label={`Quantité de ${item.name}`}
                      type="number"
                      min="1"
                      max="99"
                      value={item.quantity}
                      onChange={(event) =>
                        cart.updateQuantity(item.product_id, Number(event.target.value))
                      }
                      className="h-9 w-14 rounded-none border-x border-y-0 px-1 text-center"
                    />
                    <button
                      type="button"
                      aria-label={`Augmenter ${item.name}`}
                      onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                      className="grid size-9 place-items-center"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <p className="w-28 text-right font-bold">{money(item.price * item.quantity)}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Supprimer ${item.name}`}
                    onClick={() => cart.removeItem(item.product_id)}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </article>
              ))}
            </div>
            <div className="ml-auto mt-6 max-w-sm">
              <div className="flex justify-between text-lg font-bold">
                <span>Sous-total</span>
                <span>{money(cart.total)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Les frais éventuels sont calculés à l'étape suivante.
              </p>
              <Button
                className="mt-5 h-12 w-full bg-ivoirien font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
                onClick={() => void navigate({ to: `/shop/${slug}/commande` as any })}
              >
                Passer commande <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </main>
    </ShopFrame>
  );
}

export function PublicCheckoutPage({ slug }: { slug: string }) {
  const { shop, loading, error } = useOnlineShop(slug);
  const navigate = useNavigate();
  const cart = useCart(shop?.id ?? "");
  const [delivery, setDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod | "">("");
  const [submitting, setSubmitting] = useState(false);

  const paymentOptions: OrderPaymentMethod[] = shop
    ? [
        ...(shop.accepts_wave ? ["wave" as const] : []),
        ...(shop.accepts_orange_money ? ["orange_money" as const] : []),
        ...(shop.accepts_mtn ? ["mtn" as const] : []),
        ...(shop.accepts_moov ? ["moov" as const] : []),
        ...(!delivery && shop.accepts_cash_on_pickup ? ["cash_on_pickup" as const] : []),
        ...(delivery && shop.accepts_cash_on_delivery ? ["cash_on_delivery" as const] : []),
      ]
    : [];

  useEffect(() => {
    if (paymentMethod && !paymentOptions.includes(paymentMethod)) setPaymentMethod("");
  }, [delivery, paymentMethod, shop]);

  if (loading) return <PublicState message="Chargement de la commande…" loading />;
  if (error || !shop) return <PublicState message={error ?? "Boutique introuvable."} />;
  if (cart.items.length === 0)
    return (
      <ShopFrame shop={shop}>
        <PublicState message="Votre panier est vide." />
      </ShopFrame>
    );

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMethod || !shop) return;
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const order = await createPublicOrder({
        shopId: shop.id,
        clientName: String(formData.get("client_name") ?? ""),
        clientWhatsapp: String(formData.get("client_whatsapp") ?? ""),
        clientAddress: delivery ? String(formData.get("client_address") ?? "") : null,
        clientNotes: String(formData.get("client_notes") ?? "") || null,
        paymentMethod,
        delivery,
        items: cart.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
      });
      cart.clearCart();
      await navigate({
        to: `/shop/${slug}/confirmation/${order.id}` as any,
        search: { token: order.tracking_token } as any,
      });
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Impossible d'enregistrer la commande.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const total = cart.total + (delivery ? shop.delivery_fee : 0);
  return (
    <ShopFrame shop={shop}>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1fr_340px] sm:px-6">
        <section>
          <Link
            to={`/shop/${slug}/panier` as any}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
          >
            <ArrowLeft className="size-4" /> Retour au panier
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Finaliser la commande</h1>
          <form
            id="checkout"
            onSubmit={(event) => void submitOrder(event)}
            className="mt-6 grid gap-5"
          >
            <label className="grid gap-2 text-sm font-semibold">
              Nom complet
              <Input
                name="client_name"
                autoComplete="name"
                minLength={2}
                required
                className="h-11 rounded-lg"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Numéro WhatsApp
              <Input
                name="client_whatsapp"
                type="tel"
                autoComplete="tel"
                minLength={8}
                required
                className="h-11 rounded-lg"
              />
            </label>
            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold">Mode de réception</legend>
              <label className="flex items-center gap-3 rounded-lg border p-4">
                <input
                  type="radio"
                  name="delivery"
                  checked={!delivery}
                  onChange={() => setDelivery(false)}
                />{" "}
                Retrait en boutique
              </label>
              {shop.delivery_available ? (
                <label className="flex items-center gap-3 rounded-lg border p-4">
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery}
                    onChange={() => setDelivery(true)}
                  />{" "}
                  Livraison · {money(shop.delivery_fee)}
                </label>
              ) : null}
            </fieldset>
            {delivery ? (
              <label className="grid gap-2 text-sm font-semibold">
                Adresse de livraison
                <Input
                  name="client_address"
                  autoComplete="street-address"
                  minLength={4}
                  required
                  className="h-11 rounded-lg"
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-semibold">
              Moyen de paiement
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as OrderPaymentMethod | "")
                }
                required
                className="h-11 rounded-lg border border-slate-300 bg-white px-3"
              >
                <option value="">Choisir un moyen de paiement</option>
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {paymentLabels[method]}
                  </option>
                ))}
              </select>
            </label>
            {paymentOptions.length === 0 ? (
              <p role="alert" className="text-sm text-red-700">
                Aucun moyen de paiement n'est configuré pour ce mode de réception.
              </p>
            ) : null}
            <label className="grid gap-2 text-sm font-semibold">
              Note pour la boutique (facultatif)
              <textarea
                name="client_notes"
                rows={3}
                maxLength={1000}
                className="rounded-lg border border-slate-300 bg-white p-3 font-normal"
              />
            </label>
          </form>
        </section>
        <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold">Récapitulatif</h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="shrink-0 font-semibold">{money(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{money(cart.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{money(delivery ? shop.delivery_fee : 0)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <Button
            type="submit"
            form="checkout"
            disabled={submitting || !paymentMethod || paymentOptions.length === 0}
            className="mt-5 h-12 w-full bg-ivoirien font-semibold text-white shadow-3d hover:bg-ivoirien-hover"
          >
            {submitting ? "Enregistrement…" : "Confirmer la commande"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            La commande sera transmise à la boutique. Le paiement Mobile Money n'est pas traité sur
            ce site.
          </p>
        </aside>
      </main>
    </ShopFrame>
  );
}

export function PublicOrderConfirmationPage({
  slug,
  orderId,
  token,
}: {
  slug: string;
  orderId: string;
  token: string;
}) {
  const { shop, loading, error } = useOnlineShop(slug);
  const [order, setOrder] = useState<PublicOrderDetail | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setOrderLoading(true);
    void getPublicOrder(orderId, token)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setOrderError(reason instanceof Error ? reason.message : "Commande introuvable.");
      })
      .finally(() => {
        if (active) setOrderLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, token]);

  if (loading || orderLoading)
    return <PublicState message="Chargement de la confirmation…" loading />;
  if (error || !shop) return <PublicState message={error ?? "Boutique introuvable."} />;
  if (orderError || !order)
    return (
      <ShopFrame shop={shop}>
        <PublicState message={orderError ?? "Commande introuvable."} />
      </ShopFrame>
    );

  const whatsapp = order.shop.shop_whatsapp?.replace(/\D/g, "");
  return (
    <ShopFrame shop={shop}>
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <Check className="size-8" />
        </span>
        <p className="mt-5 text-sm font-bold uppercase text-emerald-800">Commande confirmée</p>
        <h1 className="mt-2 text-3xl font-bold">Merci, {order.client_name}</h1>
        <p className="mt-2 text-slate-600">Votre référence de commande</p>
        <p className="mt-1 text-xl font-bold text-orange-700">{order.order_number}</p>
        <section className="mt-7 rounded-lg border border-slate-200 text-left">
          {order.items.map((item, index) => (
            <div
              key={`${item.product_name}-${index}`}
              className="flex justify-between gap-4 border-b border-slate-100 p-4 last:border-0"
            >
              <span>
                {item.quantity} × {item.product_name}
              </span>
              <span className="font-semibold">{money(item.total)}</span>
            </div>
          ))}
          <div className="flex justify-between p-4 text-sm">
            <span>Livraison</span>
            <span>{money(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 p-4 font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </section>
        <p className="mt-4 text-sm text-slate-600">
          Paiement : {paymentLabels[order.payment_method]} ·{" "}
          {order.payment_status === "paid" ? "Payé" : "À confirmer"}
        </p>
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite suivre la commande ${order.order_number}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-11 items-center rounded-lg border border-emerald-700 px-5 font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Contacter la boutique par WhatsApp
          </a>
        ) : null}
        <div>
          <Link
            to={`/shop/${slug}` as any}
            className="mt-5 inline-flex items-center gap-2 font-semibold text-orange-700"
          >
            Retour à la boutique <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </ShopFrame>
  );
}
