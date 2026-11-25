import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import type { ActivityType } from "@/services/workshopService";
import { DEMO_SHOP_ID, getDemoSales, isDemoMode, updateDemoSession } from "@/services/demoService";

export type SalePaymentStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "refunded"
  | "cancelled";
export type SaleDeliveryStatus = "pending" | "ready" | "delivered";
export type SalePaymentMethod = "cash" | "wave" | "orange_money" | "mtn" | "moov";

export interface Sale {
  id: string;
  shop_id: string;
  product_id?: string | null;
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
  delivered_at?: string | null;
  delivery_notes?: string | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
}

export type CreateSaleData = Omit<Sale, "id" | "created_by" | "created_at" | "updated_at">;

export async function listSales(shopId: string, activityType?: ActivityType): Promise<Sale[]> {
  if (isDemoMode()) return getDemoSales(activityType === "phone" || activityType === "computer" ? activityType : undefined);
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
  if (isDemoMode()) return getDemoSales().find((sale) => sale.id === id) ?? null;
  if (!(await hasActiveSession())) return null;
  const { data, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Sale | null) ?? null;
}

export async function createSale(data: CreateSaleData): Promise<Sale> {
  if (isDemoMode()) {
    const now = new Date().toISOString();
    const sale: Sale = {
      ...data,
      id: `demo-sale-${crypto.randomUUID()}`,
      shop_id: DEMO_SHOP_ID,
      created_by: null,
      created_at: now,
      updated_at: now,
    };
    updateDemoSession((session) => ({ ...session, sales: [sale, ...session.sales] }));
    return sale;
  }
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
  if (isDemoMode()) {
    let updated: Sale | undefined;
    updateDemoSession((session) => ({
      ...session,
      sales: session.sales.map((sale) => {
        if (sale.id !== id) return sale;
        updated = { ...sale, ...data, updated_at: new Date().toISOString() };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Vente introuvable.");
    return updated;
  }
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
  if (isDemoMode()) {
    updateDemoSession((session) => ({
      ...session,
      sales: session.sales.filter((sale) => sale.id !== id),
    }));
    return;
  }
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

export async function markAsPaid(id: string, paymentMethod: SalePaymentMethod): Promise<Sale> {
  return updateSale(id, { payment_status: "paid", payment_method: paymentMethod });
}

async function getAuthenticatedUserId(): Promise<string> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("NO_SESSION");
  return data.user.id;
}

async function callSalesRpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw error;
  return data;
}

export async function sendSaleToCashier(id: string): Promise<void> {
  if (isDemoMode()) {
    await updateSale(id, { payment_status: "awaiting_payment" });
    return;
  }
  const userId = await getAuthenticatedUserId();
  await callSalesRpc("send_sale_to_cashier", {
    p_sale_id: id,
    p_user_id: userId,
  });
}

async function updateSaleDeliveryStatus(
  id: string,
  status: "ready" | "delivered",
  notes?: string,
): Promise<Sale> {
  const userId = await getAuthenticatedUserId();
  await callSalesRpc("update_sale_delivery_status", {
    p_sale_id: id,
    p_delivery_status: status,
    p_delivery_notes: notes?.trim() || null,
    p_user_id: userId,
  });
  const sale = await getSaleById(id);
  if (!sale) throw new Error("Vente introuvable après la mise à jour de la livraison.");
  return sale;
}

export async function markAsReady(id: string): Promise<Sale> {
  if (isDemoMode()) return updateSale(id, { delivery_status: "ready" });
  return updateSaleDeliveryStatus(id, "ready");
}

export async function markAsDelivered(id: string, notes = ""): Promise<Sale> {
  if (notes.length > 240) throw new Error("La note de livraison ne peut pas dépasser 240 caractères.");
  if (isDemoMode()) {
    return updateSale(id, {
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
      delivery_notes: notes.trim() || null,
    });
  }
  return updateSaleDeliveryStatus(id, "delivered", notes);
}

export async function refundSale(
  id: string,
  reason: string,
  userId: string,
): Promise<void> {
  if (isDemoMode()) throw new Error("Les remboursements ne sont pas disponibles en mode démo.");
  const normalizedReason = reason.trim();
  if (!normalizedReason) throw new Error("Le motif du remboursement est obligatoire.");
  if (normalizedReason.length > 240) {
    throw new Error("Le motif du remboursement ne peut pas dépasser 240 caractères.");
  }

  const authenticatedUserId = await getAuthenticatedUserId();
  if (userId !== authenticatedUserId) throw new Error("Utilisateur de remboursement invalide.");

  const result = await callSalesRpc("refund_sale_with_stock_safe", {
    p_sale_id: id,
    p_reason: normalizedReason,
    p_user_id: authenticatedUserId,
  });
  if (
    typeof result !== "object" ||
    result === null ||
    Array.isArray(result) ||
    Reflect.get(result, "success") !== true ||
    Reflect.get(result, "sale_id") !== id
  ) {
    throw new Error("Réponse invalide lors du remboursement de la vente.");
  }
}

export async function uploadSalePhoto(shopId: string, file: File): Promise<string> {
  if (isDemoMode()) throw new Error("L'envoi d'image n'est pas disponible en mode démo.");
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
