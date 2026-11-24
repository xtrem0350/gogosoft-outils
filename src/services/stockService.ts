import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import { isDemoMode } from "@/services/demoService";

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
  supplier_id?: string | null;
  location: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupplierOrderArticle {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  quantity_received?: number;
}

export interface SupplierOrder {
  id: string;
  shop_id: string;
  supplier_id?: string | null;
  supplier_name: string;
  order_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  articles: SupplierOrderArticle[] | null;
  created_at: string;
  received_at: string | null;
}

export interface StockItemFilters {
  category?: string;
  supplier_id?: string;
  stock_bas?: boolean;
  archived?: boolean;
}

type StockItemUpdates = Partial<
  Pick<StockItem, "name" | "category" | "min_quantity" | "unit_price" | "supplier" | "supplier_id">
>;

async function getCurrentUserId(): Promise<string> {
  assertStockServiceAvailable();
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("NO_SESSION");
  return data.user.id;
}

function assertStockServiceAvailable(): void {
  if (isDemoMode()) {
    throw new Error("La gestion de stock n'est pas disponible en mode démo.");
  }
}

async function callStockRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) {
    if (error.message.includes("INSUFFICIENT_STOCK")) {
      throw new Error(error.message);
    }
    throw error;
  }
  return data as T;
}

export async function listStockItems(
  shopId: string,
  filters: StockItemFilters = {},
): Promise<StockItem[]> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];

  let request = supabase
    .from("stock_items")
    .select("*")
    .eq("shop_id", validShopId)
    .order("created_at", { ascending: false });

  if (!filters.archived) request = request.is("archived_at", null);
  if (filters.category) request = request.eq("category", filters.category);
  if (filters.supplier_id) request = request.eq("supplier_id", filters.supplier_id);

  const { data, error } = await request;
  if (error) throw error;
  const items = (data ?? []) as StockItem[];
  return filters.stock_bas ? items.filter((item) => item.quantity <= item.min_quantity) : items;
}

export async function getStockItems(shopId: string): Promise<StockItem[]> {
  return listStockItems(shopId);
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
    supplier_id?: string | null;
    sku?: string | null;
    location?: string | null;
  },
): Promise<StockItem> {
  assertStockServiceAvailable();
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
    supplier_id: data.supplier_id ?? null,
    sku: data.sku ?? null,
    location: data.location ?? null,
  };

  const { data: item, error } = await supabase
    .from("stock_items")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return item as StockItem;
}

export async function updateStockItem(
  shopId: string,
  itemId: string,
  updates: StockItemUpdates,
): Promise<StockItem> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("stock_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("shop_id", validShopId)
    .eq("id", itemId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Article introuvable.");
  return data as StockItem;
}

export async function archiveStockItem(shopId: string, itemId: string): Promise<void> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("stock_items")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("shop_id", validShopId)
    .eq("id", itemId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Article introuvable ou déjà archivé.");
}

export async function adjustStock(
  shopId: string,
  itemId: string,
  movementType: "entry" | "exit",
  quantity: number,
  reason: string,
): Promise<void> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La quantité doit être un nombre positif.");
  }
  if (movementType !== "entry" && movementType !== "exit") {
    throw new Error("Type de mouvement invalide.");
  }
  const userId = await getCurrentUserId();
  await callStockRpc("adjust_stock_safe", {
    p_item_id: itemId,
    p_quantity: quantity,
    p_type: movementType,
    p_reason: reason.trim() || "Ajustement manuel",
    p_user_id: userId,
    p_shop_id: validShopId,
  });
}

export async function getSupplierOrders(shopId: string): Promise<SupplierOrder[]> {
  assertStockServiceAvailable();
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
    supplier_id: string;
    supplier_name: string;
    articles: SupplierOrderArticle[];
    total_amount: number;
    notes?: string;
    order_number?: string;
    status?: string;
  },
): Promise<SupplierOrder> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  if (!data.articles.length) throw new Error("Ajoutez au moins un article à la commande.");
  if (
    data.articles.some(
      (article) =>
        !Number.isFinite(article.quantity) ||
        article.quantity <= 0 ||
        !Number.isFinite(article.unit_price) ||
        article.unit_price < 0,
    )
  ) {
    throw new Error("Les quantités et prix des articles doivent être valides.");
  }
  if (!Number.isFinite(data.total_amount) || data.total_amount < 0) {
    throw new Error("Le montant de la commande est invalide.");
  }

  const payload = {
    shop_id: validShopId,
    supplier_id: data.supplier_id,
    supplier_name: data.supplier_name,
    order_number: data.order_number ?? `CMD-${Date.now()}`,
    status: data.status ?? "pending",
    total_amount: Number(data.total_amount),
    articles: data.articles,
    notes: data.notes ?? null,
  };

  const { data: order, error } = await supabase
    .from("supplier_orders")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return order as SupplierOrder;
}

export async function receiveSupplierOrder(
  orderId: string,
  lines: Array<{ stock_item_id: string; quantity_received: number }>,
): Promise<void> {
  assertStockServiceAvailable();
  if (!lines.length) throw new Error("La commande ne contient aucune ligne à réceptionner.");
  if (lines.some((line) => !Number.isFinite(line.quantity_received) || line.quantity_received < 0)) {
    throw new Error("Les quantités reçues doivent être positives ou nulles.");
  }
  const userId = await getCurrentUserId();
  await callStockRpc("receive_supplier_order_safe", {
    p_order_id: orderId,
    p_lines: lines,
    p_user_id: userId,
  });
}

export interface SupplierInput {
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export async function getSuppliers(
  shopId: string,
  includeArchived = false,
): Promise<Supplier[]> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) return [];
  let request = supabase
    .from("suppliers" as never)
    .select("*")
    .eq("shop_id", validShopId)
    .order("name", { ascending: true });
  if (!includeArchived) request = request.is("archived_at", null);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function createSupplier(shopId: string, input: SupplierInput): Promise<Supplier> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const name = input.name.trim();
  if (!name) throw new Error("Le nom du fournisseur est obligatoire.");
  const { data, error } = await supabase
    .from("suppliers" as never)
    .insert({
      shop_id: validShopId,
      name,
      contact_name: input.contact_name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(
  shopId: string,
  supplierId: string,
  input: SupplierInput,
): Promise<Supplier> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const name = input.name.trim();
  if (!name) throw new Error("Le nom du fournisseur est obligatoire.");
  const { data, error } = await supabase
    .from("suppliers" as never)
    .update({
      name,
      contact_name: input.contact_name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("shop_id", validShopId)
    .eq("id", supplierId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Fournisseur introuvable.");
  return data as Supplier;
}

export async function archiveSupplier(shopId: string, supplierId: string): Promise<void> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("suppliers" as never)
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
    .eq("shop_id", validShopId)
    .eq("id", supplierId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Fournisseur introuvable ou déjà archivé.");
}

export interface StockPart {
  stock_item_id?: string;
  name: string;
  quantity: number;
}

export interface RepairStockCompletion {
  final_price: number;
  notes?: string;
}

export async function deductStockForParts(
  shopId: string,
  parts: StockPart[],
  ticketId?: string,
  completion?: RepairStockCompletion,
): Promise<number> {
  assertStockServiceAvailable();
  const validShopId = requireShopId(shopId);
  if (parts.some((part) => !Number.isFinite(part.quantity) || part.quantity <= 0)) {
    throw new Error("Les quantités de pièces doivent être positives.");
  }
  const unlinkedCount = parts.filter((part) => !part.stock_item_id).length;
  if (unlinkedCount && !ticketId) {
    throw new Error("Un identifiant de fiche est requis pour tracer les pièces non liées au stock.");
  }
  const userId = await getCurrentUserId();
  const args = {
    p_shop_id: validShopId,
    p_ticket_id: ticketId ?? null,
    p_parts: parts,
    p_user_id: userId,
  };
  if (completion) {
    await callStockRpc("finalize_repair_with_stock_safe", {
      ...args,
      p_final_price: completion.final_price,
      p_notes: completion.notes?.trim() || null,
    });
  } else {
    await callStockRpc("deduct_stock_for_parts_safe", args);
  }
  return unlinkedCount;
}
