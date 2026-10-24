import { supabase } from "@/integrations/supabase/client";
import { BONUS_DAYS, DOMAIN_PRICE } from "@/constants/pricing";

export interface CheckoutData {
  shopId: string;
  planId: string;
  planPrice: number;
  modules: string[];
  domainName: string;
  subscriptionMonths: 1 | 3;
  paymentMethod: string;
  domainPrice?: number;
  bonusDays?: number;
}

export interface SubscriptionPaymentInvoice {
  id: string;
  invoice_number: string;
  shop_id: string;
  user_id: string;
  plan_id: string;
  plan_price: number;
  modules: string[];
  domain_name: string | null;
  domain_price: number;
  domain_years?: number;
  subscription_months: number;
  bonus_days: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_reference?: string | null;
  paid_at?: string | null;
}

// The payment table is not yet represented in the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscriptionPaymentTable(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (name: string) => any }).from("subscription_payments");
}

export async function createSubscriptionPayment(
  data: CheckoutData,
): Promise<SubscriptionPaymentInvoice> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié.");
  if (!data.shopId) throw new Error("Atelier introuvable.");
  if (!Number.isInteger(data.planPrice) || data.planPrice < 0) {
    throw new Error("Le prix du forfait est invalide.");
  }
  if (data.subscriptionMonths !== 1 && data.subscriptionMonths !== 3) {
    throw new Error("La durée doit être d'un ou trois mois.");
  }
  const domainPrice = data.domainPrice ?? DOMAIN_PRICE;
  const totalAmount = data.planPrice * data.subscriptionMonths + domainPrice;

  const { data: payment, error } = await subscriptionPaymentTable()
    .insert({
      shop_id: data.shopId,
      user_id: userData.user.id,
      plan_id: data.planId,
      plan_price: data.planPrice,
      modules: data.modules,
      domain_name: data.domainName || null,
      domain_price: domainPrice,
      domain_years: domainPrice > 0 ? 1 : 0,
      subscription_months: data.subscriptionMonths,
      bonus_days: data.bonusDays ?? BONUS_DAYS,
      total_amount: totalAmount,
      payment_method: data.paymentMethod,
      payment_status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return payment as SubscriptionPaymentInvoice;
}

export async function confirmPayment(paymentId: string, reference: string): Promise<void> {
  const { error } = await subscriptionPaymentTable()
    .update({
      payment_status: "paid",
      payment_reference: reference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentId);
  if (error) throw error;
}

export async function getPaymentInvoice(
  paymentId: string,
): Promise<SubscriptionPaymentInvoice> {
  const { data, error } = await subscriptionPaymentTable()
    .select("*")
    .eq("id", paymentId)
    .single();
  if (error) throw error;
  return data as SubscriptionPaymentInvoice;
}
