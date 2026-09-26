import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import type { ActivityType } from "@/services/workshopService";

export type SalePaymentStatus = "pending" | "paid" | "refunded";
export type SaleDeliveryStatus = "pending" | "ready" | "delivered";
export type SalePaymentMethod = "cash" | "wave" | "orange_money" | "mtn" | "moov";

export interface Sale {
  id: string;
  shop_id: string;
  activity_type: ActivityType;
  product_name: string;
  product_description: string | null;
  product_photo_url: string | null;
  characteristics: Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: SalePaymentStatus;
  payment_method: SalePaymentMethod | null;
  delivery_status: SaleDeliveryStatus;
  client_id: string | null;
  client_name: string | null;
  client_whatsapp: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSaleData = Omit<Sale, "id" | "created_by" | "created_at" | "updated_at">;

export async function listSales(shopId: string, activityType?: ActivityType): Promise<Sale[]> {
  if (!(await hasActiveSession())) return [];
  let query = supabase
    .from("sales")
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .order("created_at", { ascending: false });
  if (activityType) query = query.eq("activity_type", activityType);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Sale[];
}

export async function getSaleById(id: string): Promise<Sale | null> {
  if (!(await hasActiveSession())) return null;
  const { data, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Sale | null) ?? null;
}

export async function createSale(data: CreateSaleData): Promise<Sale> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: auth } = await supabase.auth.getUser();
  const { data: sale, error } = await supabase
    .from("sales")
    .insert({ ...data, shop_id: requireShopId(data.shop_id), created_by: auth.user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return sale as Sale;
}

export async function updateSale(id: string, data: Partial<CreateSaleData>): Promise<Sale> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: sale, error } = await supabase
    .from("sales")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return sale as Sale;
}

export async function deleteSale(id: string): Promise<void> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

export async function markAsPaid(id: string, paymentMethod: SalePaymentMethod): Promise<Sale> {
  return updateSale(id, { payment_status: "paid", payment_method: paymentMethod });
}

export async function markAsDelivered(id: string): Promise<Sale> {
  return updateSale(id, { delivery_status: "delivered" });
}

export async function uploadSalePhoto(shopId: string, file: File): Promise<string> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
  const path = `${requireShopId(shopId)}/${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage.from("sales-product-photos").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("sales-product-photos").getPublicUrl(path).data.publicUrl;
}
