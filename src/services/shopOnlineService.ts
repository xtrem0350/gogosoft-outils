import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type OnlineShop =
  Database["public"]["Functions"]["get_public_shop_by_slug"]["Returns"][number];
export type OnlineProduct = Database["public"]["Tables"]["products"]["Row"];
export type OnlineOrder = Database["public"]["Tables"]["orders"]["Row"];
export type OnlineOrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type ProductCategory = "phone" | "computer" | "accessory" | "consumable" | "other";
export type DeliveryStatus =
  "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type OrderPaymentMethod =
  "wave" | "orange_money" | "mtn" | "moov" | "cash_on_delivery" | "cash_on_pickup";

export type OnlineShopSettings = Partial<
  Pick<
    Database["public"]["Tables"]["shops"]["Update"],
    | "name"
    | "is_online_shop"
    | "shop_slug"
    | "shop_logo_url"
    | "shop_description"
    | "shop_banner_url"
    | "shop_phone"
    | "shop_address"
    | "shop_whatsapp"
    | "accepts_wave"
    | "accepts_orange_money"
    | "accepts_mtn"
    | "accepts_moov"
    | "accepts_cash_on_pickup"
    | "accepts_cash_on_delivery"
    | "delivery_fee"
    | "delivery_available"
  >
>;

export interface PublicOrderResult {
  id: string;
  order_number: string;
  tracking_token: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export interface PublicOrderDetail {
  id: string;
  order_number: string;
  client_name: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: OrderPaymentMethod;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  created_at: string;
  items: Array<{
    product_name: string;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  shop: {
    name: string;
    shop_phone: string | null;
    shop_whatsapp: string | null;
    shop_slug: string;
  };
}

export interface ProductInput {
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number;
  stock: number;
  image_urls: string[];
  characteristics: Json;
  is_available: boolean;
  is_featured: boolean;
}

export async function getShopBySlug(slug: string): Promise<OnlineShop | null> {
  const { data, error } = await supabase.rpc("get_public_shop_by_slug", {
    p_slug: slug.trim().toLowerCase(),
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function getPublicProducts(
  shopId: string,
  filters: { category?: ProductCategory; search?: string } = {},
): Promise<OnlineProduct[]> {
  let query = supabase.from("products").select("*").eq("shop_id", shopId).eq("is_available", true);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);
  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProductById(id: string, shopId: string): Promise<OnlineProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .eq("is_available", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPublicOrder(input: {
  shopId: string;
  clientName: string;
  clientWhatsapp: string;
  clientAddress: string | null;
  clientNotes: string | null;
  paymentMethod: OrderPaymentMethod;
  delivery: boolean;
  items: Array<{ product_id: string; quantity: number }>;
}): Promise<PublicOrderResult> {
  const { data, error } = await supabase.rpc("create_public_order", {
    p_shop_id: input.shopId,
    p_client_name: input.clientName,
    p_client_whatsapp: input.clientWhatsapp,
    p_client_address: input.clientAddress,
    p_client_notes: input.clientNotes,
    p_payment_method: input.paymentMethod,
    p_delivery: input.delivery,
    p_items: input.items as unknown as Json,
  });
  if (error) throw error;
  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    typeof data.id !== "string" ||
    typeof data.order_number !== "string" ||
    typeof data.tracking_token !== "string"
  ) {
    throw new Error("La réponse de création de commande est invalide.");
  }
  return {
    id: data.id,
    order_number: data.order_number,
    tracking_token: data.tracking_token,
    subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
    delivery_fee: typeof data.delivery_fee === "number" ? data.delivery_fee : 0,
    total: typeof data.total === "number" ? data.total : 0,
  };
}

export async function getPublicOrder(
  orderId: string,
  trackingToken: string,
): Promise<PublicOrderDetail | null> {
  const { data, error } = await supabase.rpc("get_public_order", {
    p_order_id: orderId,
    p_tracking_token: trackingToken,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as unknown as PublicOrderDetail;
}

export async function updateOnlineShopSettings(
  shopId: string,
  settings: OnlineShopSettings,
): Promise<void> {
  const { error } = await supabase.from("shops").update(settings).eq("id", shopId);
  if (error) throw error;
}

export async function isCurrentUserShopOwner(shopId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_shop_owner", { _shop_id: shopId });
  if (error) throw error;
  return data;
}

export async function uploadShopAsset(shopId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    throw new Error("Choisissez une image de 5 Mo maximum.");
  }
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${shopId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("shop-assets").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
}

export async function listShopProducts(shopId: string): Promise<OnlineProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveShopProduct(
  shopId: string,
  input: ProductInput,
  productId?: string,
): Promise<OnlineProduct> {
  const result = productId
    ? await supabase
        .from("products")
        .update(input)
        .eq("id", productId)
        .eq("shop_id", shopId)
        .select()
        .single()
    : await supabase
        .from("products")
        .insert({ ...input, shop_id: shopId })
        .select()
        .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function deleteShopProduct(shopId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("shop_id", shopId);
  if (error) throw error;
}

export async function listShopOrders(
  shopId: string,
): Promise<Array<OnlineOrder & { order_items: OnlineOrderItem[] }>> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<OnlineOrder & { order_items: OnlineOrderItem[] }>;
}

export async function getShopOrder(
  shopId: string,
  orderId: string,
): Promise<(OnlineOrder & { order_items: OnlineOrderItem[] }) | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shopId)
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data as (OnlineOrder & { order_items: OnlineOrderItem[] }) | null;
}

export async function updateShopOrder(
  orderId: string,
  deliveryStatus: DeliveryStatus,
  paymentStatus: PaymentStatus,
): Promise<void> {
  const { error } = await supabase.rpc("update_shop_order", {
    p_order_id: orderId,
    p_delivery_status: deliveryStatus,
    p_payment_status: paymentStatus,
  });
  if (error) throw error;
}
