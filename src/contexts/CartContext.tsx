import { useEffect, useState, type ReactNode } from "react";
import { CartContext, type CartItem, type ShopCarts } from "@/contexts/cartContextStore";
import { DEMO_SHOP_ID } from "@/services/demoService";

export type { CartItem, ShopCarts } from "@/contexts/cartContextStore";

const STORAGE_KEY = "gogosoft_cart";
const DEMO_CART_KEY = "gogosoft.demo.cart";

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.product_id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    (typeof item.image_url === "string" || item.image_url === null)
  );
}

function readCarts(): ShopCarts {
  if (typeof window === "undefined") return {};
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return {};
    const carts = Object.fromEntries(
      Object.entries(saved).map(([shopId, items]) => [
        shopId,
        Array.isArray(items) ? items.filter(isCartItem) : [],
      ]),
    );
    const demoItems: unknown = JSON.parse(window.sessionStorage.getItem(DEMO_CART_KEY) ?? "[]");
    if (Array.isArray(demoItems)) carts[DEMO_SHOP_ID] = demoItems.filter(isCartItem);
    return carts;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<ShopCarts>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCarts(readCarts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const persistentCarts = { ...carts };
    const demoItems = persistentCarts[DEMO_SHOP_ID] ?? [];
    delete persistentCarts[DEMO_SHOP_ID];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentCarts));
    window.sessionStorage.setItem(DEMO_CART_KEY, JSON.stringify(demoItems));
  }, [carts, hydrated]);

  function addItem(shopId: string, item: CartItem) {
    setCarts((current: ShopCarts) => {
      const shopItems = current[shopId] ?? [];
      const existing = shopItems.find((entry: CartItem) => entry.product_id === item.product_id);
      const nextItems = existing
        ? shopItems.map((entry: CartItem) =>
            entry.product_id === item.product_id
              ? { ...entry, quantity: Math.min(99, entry.quantity + item.quantity) }
              : entry,
          )
        : [...shopItems, { ...item, quantity: Math.min(99, item.quantity) }];
      return { ...current, [shopId]: nextItems };
    });
  }

  function removeItem(shopId: string, productId: string) {
    setCarts((current: ShopCarts) => ({
      ...current,
      [shopId]: (current[shopId] ?? []).filter((item: CartItem) => item.product_id !== productId),
    }));
  }

  function updateQuantity(shopId: string, productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      removeItem(shopId, productId);
      return;
    }
    setCarts((current: ShopCarts) => ({
      ...current,
      [shopId]: (current[shopId] ?? []).map((item: CartItem) =>
        item.product_id === productId ? { ...item, quantity: Math.min(99, quantity) } : item,
      ),
    }));
  }

  function clearCart(shopId: string) {
    setCarts((current: ShopCarts) => {
      const next = { ...current };
      delete next[shopId];
      return next;
    });
  }

  return (
    <CartContext.Provider value={{ carts, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
