import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import {
  addDemoCashClosure,
  getDemoCashClosures,
  getDemoSales,
  isDemoMode,
  readDemoSession,
} from "@/services/demoService";

export interface CashPeriod {
  start: Date;
  end: Date;
}

export interface CashSummary {
  totalWorkshop: number;
  totalSales: number;
  totalGeneral: number;
  breakdown: Record<string, number>;
  workshopPayments: Array<{
    id: string;
    amount: number;
    method: string;
    ticket_number: string | null;
    client_name: string | null;
    device_model: string | null;
    payment_type: "entry" | "final";
    created_at: string;
    received_by?: string | null;
  }>;
  sales: Array<{
    id: string;
    total_price: number;
    payment_method: string | null;
    product_name: string;
    client_name: string | null;
    created_at: string;
  }>;
}

export interface CashClosure {
  id: string;
  shop_id: string;
  period_start: string;
  period_end: string;
  total_workshop: number;
  total_sales: number;
  total_general: number;
  breakdown: Record<string, number>;
  closed_by: string | null;
  notes: string | null;
  created_at: string;
  total_entries?: number;
  total_exits?: number;
  balance?: number;
  closure_date?: string;
}

export interface CashExit {
  id: string;
  shop_id: string;
  type: "parts" | "expense";
  amount: number;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

type WorkshopPaymentRow = {
  id: string;
  amount: number;
  method: string;
  ticket_id: string;
  received_by: string | null;
  payment_type: "entry" | "final";
  created_at: string;
};

function emptyBreakdown(): Record<string, number> {
  return { cash: 0, wave: 0, orange_money: 0, mtn: 0, moov: 0 };
}

function summarize(
  workshopPayments: CashSummary["workshopPayments"],
  sales: CashSummary["sales"],
): CashSummary {
  const totalWorkshop = workshopPayments.reduce((total, payment) => total + payment.amount, 0);
  const totalSales = sales.reduce((total, sale) => total + sale.total_price, 0);
  const breakdown = emptyBreakdown();
  for (const payment of workshopPayments) {
    breakdown[payment.method] = (breakdown[payment.method] ?? 0) + payment.amount;
  }
  for (const sale of sales) {
    const method = sale.payment_method ?? "unknown";
    breakdown[method] = (breakdown[method] ?? 0) + sale.total_price;
  }
  return {
    totalWorkshop,
    totalSales,
    totalGeneral: totalWorkshop + totalSales,
    breakdown,
    workshopPayments,
    sales,
  };
}

export async function getCashSummary(shopId: string, period: CashPeriod): Promise<CashSummary> {
  if (isDemoMode()) {
    const session = readDemoSession();
    const start = period.start.getTime();
    const end = period.end.getTime();
    const tickets = session?.tickets ?? [];
    const workshopPayments = (session?.workshop_payments ?? [])
      .filter((payment) => {
        const time = new Date(payment.created_at).getTime();
        return payment.shop_id === shopId && time >= start && time <= end;
      })
      .map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        ticket_number: tickets.find((ticket) => ticket.id === payment.ticket_id)?.ticket_number ?? null,
        client_name: tickets.find((ticket) => ticket.id === payment.ticket_id)?.client_name ?? null,
        device_model: tickets.find((ticket) => ticket.id === payment.ticket_id)?.device_model ?? null,
        payment_type: payment.payment_type,
        created_at: payment.created_at,
        received_by: payment.received_by,
      }));
    const sales = getDemoSales()
      .filter((sale) => {
        const time = new Date(sale.created_at).getTime();
        return sale.shop_id === shopId && sale.payment_status === "paid" && time >= start && time <= end;
      })
      .map((sale) => ({
        id: sale.id,
        total_price: sale.total_price,
        payment_method: sale.payment_method,
        product_name: sale.product_name,
        client_name: sale.client_name,
        created_at: sale.created_at,
      }));
    return summarize(workshopPayments, sales);
  }

  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const validShopId = requireShopId(shopId);
  const start = period.start.toISOString();
  const end = period.end.toISOString();
  const [{ data: paymentRows, error: paymentError }, { data: salesRows, error: salesError }] =
    await Promise.all([
      (supabase.from("workshop_payments" as any) as any)
        .select("id, amount, method, ticket_id, received_by, payment_type, created_at")
        .eq("shop_id", validShopId)
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("sales")
        .select("id, total_price, payment_method, product_name, client_name, created_at")
        .eq("shop_id", validShopId)
        .eq("payment_status", "paid")
        .gte("created_at", start)
        .lte("created_at", end),
    ]);
  if (paymentError) throw paymentError;
  if (salesError) throw salesError;

  const payments = (paymentRows ?? []) as WorkshopPaymentRow[];
  const ticketIds = [...new Set(payments.map((payment) => payment.ticket_id))];
  const { data: ticketRows, error: ticketError } = ticketIds.length
    ? await (supabase.from("workshop_tickets" as any) as any)
        .select("id, ticket_number, client_name, device_model")
        .eq("shop_id", validShopId)
        .in("id", ticketIds)
    : { data: [], error: null };
  if (ticketError) throw ticketError;
  const ticketNumbers = new Map(
    (
      (ticketRows ?? []) as Array<{
        id: string;
        ticket_number: string | null;
        client_name: string | null;
        device_model: string | null;
      }>
    ).map((ticket) => [ticket.id, ticket]),
  );
  const workshopPayments = payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    method: payment.method,
    ticket_number: ticketNumbers.get(payment.ticket_id)?.ticket_number ?? null,
    client_name: ticketNumbers.get(payment.ticket_id)?.client_name ?? null,
    device_model: ticketNumbers.get(payment.ticket_id)?.device_model ?? null,
    payment_type: payment.payment_type,
    created_at: payment.created_at,
    received_by: payment.received_by,
  }));
  const sales = (salesRows ?? []) as CashSummary["sales"];
  return summarize(workshopPayments, sales);
}

export async function closeCashPeriod(
  shopId: string,
  period: CashPeriod,
  notes?: string,
  totalExits = 0,
): Promise<void> {
  const summary = await getCashSummary(shopId, period);
  if (isDemoMode()) {
    const session = readDemoSession();
    if (!session) throw new Error("La session de démonstration a expiré.");
    addDemoCashClosure({
      id: `demo-cash-${crypto.randomUUID()}`,
      shop_id: shopId,
      period_start: period.start.toISOString(),
      period_end: period.end.toISOString(),
      total_workshop: summary.totalWorkshop,
      total_sales: summary.totalSales,
      total_general: summary.totalGeneral,
      breakdown: summary.breakdown,
      closed_by: null,
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
    });
    return;
  }

  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const { error } = await (supabase.from("cash_closures" as any) as any).insert({
    shop_id: requireShopId(shopId),
    period_start: period.start.toISOString(),
    period_end: period.end.toISOString(),
    total_workshop: summary.totalWorkshop,
    total_sales: summary.totalSales,
    total_general: summary.totalGeneral,
    total_entries: summary.totalGeneral,
    total_exits: totalExits,
    balance: summary.totalGeneral - totalExits,
    closure_date: period.end.toISOString().slice(0, 10),
    breakdown: summary.breakdown,
    closed_by: auth.user?.id ?? null,
    notes: notes?.trim() || null,
  });
  if (error) throw error;
}

export async function getCashExits(
  shopId: string,
  period: CashPeriod,
): Promise<CashExit[]> {
  if (isDemoMode()) return [];
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await (supabase.from("cash_exits" as any) as any)
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .gte("created_at", period.start.toISOString())
    .lte("created_at", period.end.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CashExit[];
}

export async function createCashExit(
  shopId: string,
  input: Pick<CashExit, "type" | "amount" | "description">,
): Promise<CashExit> {
  if (isDemoMode()) throw new Error("Les sorties de caisse ne sont pas disponibles en mode démo.");
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Le montant doit être supérieur à zéro.");
  }
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const { data, error } = await (supabase.from("cash_exits" as any) as any)
    .insert({
      shop_id: requireShopId(shopId),
      type: input.type,
      amount: Math.round(input.amount),
      description: input.description?.trim() || null,
      created_by: auth.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CashExit;
}

export async function getCashClosures(shopId: string): Promise<CashClosure[]> {
  if (isDemoMode()) return getDemoCashClosures().filter((closure) => closure.shop_id === shopId);
  if (!(await hasActiveSession())) return [];
  const { data, error } = await (supabase.from("cash_closures" as any) as any)
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CashClosure[];
}
