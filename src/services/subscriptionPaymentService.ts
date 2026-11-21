import { supabase } from "@/integrations/supabase/client";
import { DOMAIN_PRICE } from "@/constants/pricing";
import { shopCodesFromModuleIds, type ModuleId } from "@/types/modules";

export type SubscriptionPaymentType = "souscription" | "renouvellement" | "ajout_module";

export type SubscriptionPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "en_attente_paiement_espece";

export type SubscriptionPaymentMethod = "cash" | "wave" | "orange_money" | "mtn_momo";

export interface SubscriptionInvoiceLines {
  modules: ModuleId[];
  module_codes: string[];
  plan_price: number;
  domain_name: string | null;
  domain_price: number;
  additional_amount: number;
  duration_days: number;
}

export interface CheckoutData {
  shopId: string | null;
  planId: string;
  planPrice: number;
  additionalAmount?: number;
  modules: ModuleId[];
  domainName: string | null;
  subscriptionMonths: 1 | 3;
  paymentMethod: SubscriptionPaymentMethod;
  domainPrice?: number;
}

export interface SubscriptionPaymentInvoice {
  id: string;
  invoice_number: string;
  shop_id: string | null;
  user_id: string;
  plan_id: string;
  lines: SubscriptionInvoiceLines;
  duration_days: number;
  total_amount: number;
  payment_method: SubscriptionPaymentMethod;
  payment_status: SubscriptionPaymentStatus;
  payment_reference: string | null;
  paid_at: string | null;
  payment_type: SubscriptionPaymentType;
}

export interface PendingCashCheckoutResult {
  success: true;
  pending: true;
  message: string;
  invoice: SubscriptionPaymentInvoice;
}

export type CheckoutPaymentResult =
  | SubscriptionPaymentInvoice
  | PendingCashCheckoutResult;

interface SubscriptionInvoiceRow {
  id: string;
  shop_id: string | null;
  user_id: string;
  plan_id: string;
  lines: SubscriptionInvoiceLines;
  duration_days: number;
  total_amount: number;
  payment_method: SubscriptionPaymentMethod;
  payment_status: SubscriptionPaymentStatus;
  payment_reference: string | null;
  payment_type: SubscriptionPaymentType;
  paid_at: string | null;
}

function toSubscriptionPaymentInvoice(
  invoice: SubscriptionInvoiceRow,
): SubscriptionPaymentInvoice {
  return {
    ...invoice,
    invoice_number: invoice.id,
    paid_at: invoice.paid_at ?? null,
  };
}

async function resolvePaymentType(
  data: CheckoutData,
  userId: string,
): Promise<SubscriptionPaymentType> {
  if (data.planId === "domain-additional") return "ajout_module";
  if (data.planId === "domain-renewal" || data.planId === "renewal") {
    return "renouvellement";
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  return subscription &&
    ["active", "trial", "expired", "inactive"].includes(subscription.status)
    ? "renouvellement"
    : "souscription";
}

export async function createSubscriptionPayment(
  data: CheckoutData,
): Promise<SubscriptionPaymentInvoice> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié.");
  if (!Number.isInteger(data.planPrice) || data.planPrice < 0) {
    throw new Error("Le prix du forfait est invalide.");
  }
  if (data.subscriptionMonths !== 1 && data.subscriptionMonths !== 3) {
    throw new Error("La durée doit être d'un ou trois mois.");
  }
  const domainPrice = data.domainPrice ?? DOMAIN_PRICE;
  const additionalAmount = data.additionalAmount ?? 0;
  if (!Number.isInteger(domainPrice) || domainPrice < 0) {
    throw new Error("Le prix du domaine est invalide.");
  }
  if (!Number.isInteger(additionalAmount) || additionalAmount < 0) {
    throw new Error("Le montant additionnel est invalide.");
  }
  const durationDays = data.subscriptionMonths * 30;
  const totalAmount =
    data.planPrice * data.subscriptionMonths + domainPrice + additionalAmount;
  const paymentType = await resolvePaymentType(data, userData.user.id);
  const moduleCodes = shopCodesFromModuleIds(data.modules);
  const lines: SubscriptionInvoiceLines = {
    modules: data.modules,
    module_codes: moduleCodes,
    plan_price: data.planPrice,
    domain_name: data.domainName || null,
    domain_price: domainPrice,
    additional_amount: additionalAmount,
    duration_days: durationDays,
  };

  const { data: invoice, error } = await supabase
    .from("subscription_invoices")
    .insert({
      shop_id: data.shopId,
      user_id: userData.user.id,
      plan_id: data.planId,
      lines,
      duration_days: durationDays,
      total_amount: totalAmount,
      payment_method: data.paymentMethod,
      payment_status: "en_attente_paiement_espece",
      payment_type: paymentType,
      payment_reference: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toSubscriptionPaymentInvoice(invoice as SubscriptionInvoiceRow);
}

export async function confirmPayment(
  _paymentId: string,
  _reference: string,
): Promise<void> {
  throw new Error("Le paiement doit être validé par un SuperAdmin.");
}

export async function getSubscriptionPayment(
  paymentId: string,
): Promise<SubscriptionPaymentInvoice> {
  const { data, error } = await supabase
    .from("subscription_invoices")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (error) throw error;
  return toSubscriptionPaymentInvoice(data as SubscriptionInvoiceRow);
}

export async function getPaymentInvoice(
  paymentId: string,
): Promise<SubscriptionPaymentInvoice> {
  return getSubscriptionPayment(paymentId);
}
