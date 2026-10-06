import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

type ShopCarts = Record<string, CartItem[]>;

interface CartContextValue {
  carts: ShopCarts;
  addItem: (shopId: string, item: CartItem) => void;
  removeItem: (shopId: string, productId: string) => void;
  updateQuantity: (shopId: string, productId: string, quantity: number) => void;
  clearCart: (shopId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "gogosoft_cart";

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
    return Object.fromEntries(
      Object.entries(saved).map(([shopId, items]) => [
        shopId,
        Array.isArray(items) ? items.filter(isCartItem) : [],
      ]),
    );
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
  }, [carts, hydrated]);

  function addItem(shopId: string, item: CartItem) {
    setCarts((current) => {
      const shopItems = current[shopId] ?? [];
      const existing = shopItems.find((entry) => entry.product_id === item.product_id);
      const nextItems = existing
        ? shopItems.map((entry) =>
            entry.product_id === item.product_id
              ? { ...entry, quantity: Math.min(99, entry.quantity + item.quantity) }
              : entry,
          )
        : [...shopItems, { ...item, quantity: Math.min(99, item.quantity) }];
      return { ...current, [shopId]: nextItems };
    });
  }

  function removeItem(shopId: string, productId: string) {
    setCarts((current) => ({
      ...current,
      [shopId]: (current[shopId] ?? []).filter((item) => item.product_id !== productId),
    }));
  }

  function updateQuantity(shopId: string, productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      removeItem(shopId, productId);
      return;
    }
    setCarts((current) => ({
      ...current,
      [shopId]: (current[shopId] ?? []).map((item) =>
        item.product_id === productId ? { ...item, quantity: Math.min(99, quantity) } : item,
      ),
    }));
  }

  function clearCart(shopId: string) {
    setCarts((current) => {
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

export function useCart(shopId: string) {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider.");
  const items = context.carts[shopId] ?? [];
  return {
    items,
    addItem: (item: CartItem) => context.addItem(shopId, item),
    removeItem: (productId: string) => context.removeItem(shopId, productId),
    updateQuantity: (productId: string, quantity: number) =>
      context.updateQuantity(shopId, productId, quantity),
    clearCart: () => context.clearCart(shopId),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
