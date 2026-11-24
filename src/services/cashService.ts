// src/services/cashService.ts

import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

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
  totalManualEntries: number;
  totalGeneral: number;
  breakdown: Record<string, number>;
  manualEntries: Array<{
    id: string;
    amount: number;
    method: string;
    description: string | null;
    created_at: string;
  }>;
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

export interface CashSession {
  id: string;
  shop_id: string;
  opened_by: string | null;
  opened_at: string;
  opening_amount: number;
  closed_by: string | null;
  closed_at: string | null;
  closing_amount: number | null;
  theoretical_amount: number | null;
  difference: number | null;
  status: "ouverte" | "fermee";
  notes: string | null;
}

export interface CashReceiptRecord {
  shop_id: string;
  receipt_number: string;
  source_id: string;
  reference: string;
  clientName: string;
  device: string;
  amount: number;
  paymentMethod: string;
  date: string;
  shop_name: string;
}

export function createCashReceiptNumber(shopId: string, sourceId: string, date: string): string {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) throw new Error("La date du reçu est invalide.");
  const shopPart = shopId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  const sourcePart = sourceId.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `REC-${shopPart}-${timestamp.toString(36).toUpperCase()}-${sourcePart || "PAIEMENT"}`;
}

export function archiveCashReceipt(receipt: CashReceiptRecord): void {
  const key = `gogosoft.cash-receipts.${receipt.shop_id}`;
  const stored = window.localStorage.getItem(key);
  const parsed: unknown = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(parsed)) throw new Error("L'archive des reçus est invalide.");
  const receipts = parsed as CashReceiptRecord[];
  const nextReceipts = [
    ...receipts.filter((item) => item.receipt_number !== receipt.receipt_number),
    receipt,
  ];
  window.localStorage.setItem(key, JSON.stringify(nextReceipts));
}

export async function assertSessionOpen(shopId: string): Promise<void> {
  if (isDemoMode()) return;
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data, error } = await supabase
    .from("cash_sessions" as never)
    .select("id")
    .eq("shop_id", requireShopId(shopId))
    .is("closed_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Ouvrez une session de caisse pour effectuer des opérations.");
}

export async function getOpenCashSession(shopId: string): Promise<CashSession | null> {
  const { data, error } = await supabase
    .from("cash_sessions" as never)
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "ouverte")
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as CashSession | null;
}

export async function openCashSession(shopId: string, openingAmount: number): Promise<{ session_id: string }> {
  const { data, error } = await supabase.rpc("open_cash_session" as never, {
    p_shop_id: shopId,
    p_opening_amount: openingAmount,
  } as never);
  if (error) throw new Error(error.message);
  return data as { session_id: string };
}

export async function closeCashSession(sessionId: string, closingAmount: number, notes?: string): Promise<{
  theoretical_amount: number;
  closing_amount: number;
  difference: number;
}> {
  const { data, error } = await supabase.rpc("close_cash_session" as never, {
    p_session_id: sessionId,
    p_closing_amount: closingAmount,
    p_notes: notes ?? null,
  } as never);
  if (error) throw new Error(error.message);
  return data as { theoretical_amount: number; closing_amount: number; difference: number };
}

export async function createCashEntry(shopId: string, input: {
  amount: number;
  method: "cash" | "wave" | "orange_money" | "mtn" | "moov";
  description?: string;
}): Promise<{ entry_id: string }> {
  await assertSessionOpen(shopId);
  const { data, error } = await supabase.rpc("create_cash_entry" as never, {
    p_shop_id: shopId,
    p_amount: input.amount,
    p_method: input.method,
    p_description: input.description ?? null,
  } as never);
  if (error) throw new Error(error.message);
  return data as { entry_id: string };
}

export type WorkshopPaymentMethod = "cash" | "wave" | "orange_money" | "mtn" | "moov";

export async function closeWorkshopTicketPayment(input: {
  shopId: string;
  ticketId: string;
  amount: number;
  paymentType: "entry" | "balance";
  paymentMethod: WorkshopPaymentMethod;
  notes?: string;
}): Promise<{ success: boolean; payment_id: string; new_status: string; amount: number }> {
  await assertSessionOpen(input.shopId);
  const { data, error } = await (supabase.rpc("close_workshop_ticket_payment" as never, {
    p_ticket_id: input.ticketId,
    p_amount: input.amount,
    p_payment_type: input.paymentType,
    p_payment_method: input.paymentMethod,
    p_notes: input.notes ?? null,
  } as never) as never as { data: unknown; error: { message: string } | null });
  if (error) throw new Error(error.message);
  return data as { success: boolean; payment_id: string; new_status: string; amount: number };
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

type CashManualEntryRow = CashSummary["manualEntries"][number];

function emptyBreakdown(): Record<string, number> {
  return { cash: 0, wave: 0, orange_money: 0, mtn: 0, moov: 0 };
}

function summarize(
  workshopPayments: CashSummary["workshopPayments"],
  sales: CashSummary["sales"],
  manualEntries: CashSummary["manualEntries"] = [],
): CashSummary {
  const totalWorkshop = workshopPayments.reduce((total, payment) => total + payment.amount, 0);
  const totalSales = sales.reduce((total, sale) => total + sale.total_price, 0);
  const totalManualEntries = manualEntries.reduce((total, entry) => total + entry.amount, 0);
  const breakdown = emptyBreakdown();
  for (const payment of workshopPayments) {
    breakdown[payment.method] = (breakdown[payment.method] ?? 0) + payment.amount;
  }
  for (const sale of sales) {
    const method = sale.payment_method ?? "unknown";
    breakdown[method] = (breakdown[method] ?? 0) + sale.total_price;
  }
  for (const entry of manualEntries) {
    breakdown[entry.method] = (breakdown[entry.method] ?? 0) + entry.amount;
  }
  return {
    totalWorkshop,
    totalSales,
    totalManualEntries,
    totalGeneral: totalWorkshop + totalSales + totalManualEntries,
    breakdown,
    manualEntries,
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
  const [
    { data: paymentRows, error: paymentError },
    { data: salesRows, error: salesError },
    { data: manualEntryRows, error: manualEntryError },
  ] =
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
      (supabase.from("cash_entries" as any) as any)
        .select("id, amount, method, description, created_at")
        .eq("shop_id", validShopId)
        .gte("created_at", start)
        .lte("created_at", end),
    ]);
  if (paymentError) throw paymentError;
  if (salesError) throw salesError;
  if (manualEntryError) throw manualEntryError;

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
  const manualEntries = (manualEntryRows ?? []) as CashManualEntryRow[];
  return summarize(workshopPayments, sales, manualEntries);
}

interface CashExportRow {
  date: string;
  type: string;
  amount: number;
  method: string;
  description: string;
}

interface CashExportData {
  shopName: string;
  rows: CashExportRow[];
  totalEntries: number;
  totalExits: number;
  balance: number;
}

function formatExportMoney(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

async function getCashExportData(shopId: string, period: CashPeriod): Promise<CashExportData> {
  if (!Number.isFinite(period.start.getTime()) || !Number.isFinite(period.end.getTime())) {
    throw new Error("La période d'export est invalide.");
  }
  if (period.start > period.end) throw new Error("La date de début doit précéder la date de fin.");
  const [summary, exits] = await Promise.all([
    getCashSummary(shopId, period),
    getCashExits(shopId, period),
  ]);
  let shopName = "Boutique démo";
  if (!isDemoMode()) {
    const { data: shop, error } = await supabase
      .from("shops")
      .select("name")
      .eq("id", requireShopId(shopId))
      .maybeSingle();
    if (error) throw error;
    if (!shop) throw new Error("Boutique introuvable.");
    shopName = shop.name;
  }

  const rows: CashExportRow[] = [
    ...summary.workshopPayments.map((payment) => ({
      date: payment.created_at,
      type: payment.payment_type === "entry" ? "Entrée atelier" : "Solde atelier",
      amount: payment.amount,
      method: payment.method,
      description: [
        payment.ticket_number ? `Fiche ${payment.ticket_number}` : "Réparation",
        payment.client_name,
        payment.device_model,
      ].filter(Boolean).join(" · "),
    })),
    ...summary.sales.map((sale) => ({
      date: sale.created_at,
      type: "Vente",
      amount: sale.total_price,
      method: sale.payment_method ?? "—",
      description: [sale.product_name, sale.client_name].filter(Boolean).join(" · "),
    })),
    ...summary.manualEntries.map((entry) => ({
      date: entry.created_at,
      type: "Entrée manuelle",
      amount: entry.amount,
      method: entry.method,
      description: entry.description ?? "",
    })),
    ...exits.map((exit) => ({
      date: exit.created_at,
      type: exit.type === "parts" ? "Sortie pièces" : "Sortie dépense",
      amount: -exit.amount,
      method: "—",
      description: exit.description ?? "",
    })),
  ].sort((first, second) => first.date.localeCompare(second.date));
  const totalEntries = summary.totalGeneral;
  const totalExits = exits.reduce((total, exit) => total + exit.amount, 0);
  return { shopName, rows, totalEntries, totalExits, balance: totalEntries - totalExits };
}

function downloadExportFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportFilename(extension: string, period: CashPeriod): string {
  const start = period.start.toISOString().slice(0, 10);
  const end = period.end.toISOString().slice(0, 10);
  return `export-caisse-${start}-${end}.${extension}`;
}

export async function exportCashToCsv(shopId: string, period: CashPeriod): Promise<void> {
  const data = await getCashExportData(shopId, period);
  const csvRows = [
    ["Export comptable GogoSoft"],
    ["Boutique", data.shopName],
    ["Période", period.start.toLocaleDateString("fr-FR"), "au", period.end.toLocaleDateString("fr-FR")],
    ["Date d'export", new Date().toLocaleString("fr-FR")],
    [],
    ["Date", "Type", "Montant (FCFA)", "Mode", "Description"],
    ...data.rows.map((row) => [
      new Date(row.date).toLocaleString("fr-FR"),
      row.type,
      String(row.amount),
      row.method,
      row.description,
    ]),
    [],
    ["Total entrées (FCFA)", String(data.totalEntries)],
    ["Total sorties (FCFA)", String(data.totalExits)],
    ["Solde (FCFA)", String(data.balance)],
  ];
  const csv = csvRows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(";"),
    )
    .join("\r\n");
  downloadExportFile(
    exportFilename("csv", period),
    new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
  );
}

export async function exportCashToExcel(shopId: string, period: CashPeriod): Promise<void> {
  const data = await getCashExportData(shopId, period);
  const rows: Array<Array<string | number>> = [
    ["Export comptable GogoSoft"],
    ["Boutique", data.shopName],
    ["Période", period.start.toLocaleDateString("fr-FR"), "au", period.end.toLocaleDateString("fr-FR")],
    ["Date d'export", new Date().toLocaleString("fr-FR")],
    [],
    ["Date", "Type", "Montant (FCFA)", "Mode", "Description"],
    ...data.rows.map((row) => [
      new Date(row.date).toLocaleString("fr-FR"),
      row.type,
      row.amount,
      row.method,
      row.description,
    ]),
    [],
    ["Total entrées (FCFA)", data.totalEntries],
    ["Total sorties (FCFA)", data.totalExits],
    ["Solde (FCFA)", data.balance],
  ];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Caisse");
  const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadExportFile(
    exportFilename("xlsx", period),
    new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export async function exportCashToPdf(shopId: string, period: CashPeriod): Promise<void> {
  const data = await getCashExportData(shopId, period);
  const pdf = new jsPDF("p", "mm", "a4");
  const left = 14;
  const right = 196;
  let y = 16;
  const addLine = (text: string, fontSize = 9) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, right - left);
    for (const line of lines as string[]) {
      if (y > 282) {
        pdf.addPage();
        y = 16;
      }
      pdf.text(line, left, y);
      y += fontSize > 11 ? 7 : 5;
    }
  };
  addLine("Export comptable GogoSoft", 15);
  addLine(`Boutique : ${data.shopName}`);
  addLine(
    `Période : ${period.start.toLocaleDateString("fr-FR")} au ${period.end.toLocaleDateString("fr-FR")}`,
  );
  addLine(`Date d'export : ${new Date().toLocaleString("fr-FR")}`);
  y += 3;
  addLine("Date | Type | Montant (FCFA) | Mode | Description", 10);
  for (const row of data.rows) {
    addLine(
      `${new Date(row.date).toLocaleString("fr-FR")} | ${row.type} | ${formatExportMoney(row.amount)} | ${row.method} | ${row.description}`,
    );
  }
  y += 3;
  addLine(`Total entrées : ${formatExportMoney(data.totalEntries)} FCFA`, 10);
  addLine(`Total sorties : ${formatExportMoney(data.totalExits)} FCFA`, 10);
  addLine(`Solde : ${formatExportMoney(data.balance)} FCFA`, 10);
  pdf.save(exportFilename("pdf", period));
}

export async function closeCashPeriod(
  shopId: string,
  period: CashPeriod,
  notes?: string,
  totalExits = 0,
): Promise<void> {
  if (!isDemoMode() && (await getOpenCashSession(shopId))) {
    throw new Error("Fermez d'abord la session de caisse.");
  }
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
  await assertSessionOpen(shopId);
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

export const registerCashOutflow = createCashExit;

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
