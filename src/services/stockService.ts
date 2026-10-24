import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";

export interface StockItem {
  id: string;
  shop_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  supplier: string | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SupplierOrder {
  id: string;
  shop_id: string;
  supplier_name: string;
  order_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  received_at: string | null;
}

export async function getStockItems(shopId: string): Promise<StockItem[]> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .eq("shop_id", validShopId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function createStockItem(
  shopId: string,
  data: {
    name: string;
    category?: string | null;
    quantity?: number;
    min_quantity?: number;
    unit_price?: number;
    supplier?: string | null;
    sku?: string | null;
    location?: string | null;
  },
): Promise<StockItem> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");

  const payload = {
    shop_id: validShopId,
    name: data.name,
    category: data.category ?? null,
    quantity: Number(data.quantity ?? 0),
    min_quantity: Number(data.min_quantity ?? 0),
    unit_price: Number(data.unit_price ?? 0),
    supplier: data.supplier ?? null,
    sku: data.sku ?? null,
    location: data.location ?? null,
  };

  const { data: item, error } = await supabase.from("stock_items").insert(payload).select("*").single();
  if (error) throw error;
  return item as StockItem;
}

export async function adjustStock(
  shopId: string,
  itemId: string,
  movementType: "entry" | "exit",
  quantity: number,
  reason: string,
): Promise<void> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");

  const { data: currentItem, error: currentError } = await supabase
    .from("stock_items")
    .select("quantity")
    .eq("shop_id", validShopId)
    .eq("id", itemId)
    .maybeSingle();
  if (currentError) throw currentError;

  const currentQuantity = Number(currentItem?.quantity ?? 0);
  const delta = movementType === "entry" ? Number(quantity) : -Number(quantity);
  const nextQuantity = currentQuantity + delta;

  const { error: movementError } = await supabase.from("stock_movements").insert({
    shop_id: validShopId,
    stock_item_id: itemId,
    movement_type: movementType,
    quantity: Number(quantity),
    reason,
    reference: `adjust-${Date.now()}`,
  });
  if (movementError) throw movementError;

  const { error: updateError } = await supabase
    .from("stock_items")
    .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
    .eq("shop_id", validShopId)
    .eq("id", itemId);
  if (updateError) throw updateError;
}

export async function getSupplierOrders(shopId: string): Promise<SupplierOrder[]> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  const { data, error } = await supabase
    .from("supplier_orders")
    .select("*")
    .eq("shop_id", validShopId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SupplierOrder[];
}

export async function createSupplierOrder(
  shopId: string,
  data: {
    supplier_name: string;
    articles?: Array<{ name: string; quantity: number; unit_price: number }>;
    total_amount: number;
    notes?: string;
    order_number?: string;
    status?: string;
  },
): Promise<SupplierOrder> {
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");

  const payload = {
    shop_id: validShopId,
    supplier_name: data.supplier_name,
    order_number: data.order_number ?? `CMD-${Date.now()}`,
    status: data.status ?? "pending",
    total_amount: Number(data.total_amount ?? 0),
    notes: data.notes ?? null,
  };

  const { data: order, error } = await supabase.from("supplier_orders").insert(payload).select("*").single();
  if (error) throw error;
  return order as SupplierOrder;
}
