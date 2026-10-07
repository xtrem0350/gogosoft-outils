import { createContext } from "react";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export type ShopCarts = Record<string, CartItem[]>;

export interface CartContextValue {
  carts: ShopCarts;
  addItem: (shopId: string, item: CartItem) => void;
  removeItem: (shopId: string, productId: string) => void;
  updateQuantity: (shopId: string, productId: string, quantity: number) => void;
  clearCart: (shopId: string) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
