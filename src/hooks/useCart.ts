import { useContext } from "react";

import { CartContext } from "@/contexts/cartContextStore";

export function useCart(shopId: string) {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider.");
  const items = context.carts[shopId] ?? [];
  return {
    items,
    addItem: (item: import("@/contexts/cartContextStore").CartItem) => context.addItem(shopId, item),
    removeItem: (productId: string) => context.removeItem(shopId, productId),
    updateQuantity: (productId: string, quantity: number) =>
      context.updateQuantity(shopId, productId, quantity),
    clearCart: () => context.clearCart(shopId),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
