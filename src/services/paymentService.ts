/** Services de gestion des paiements de démonstration pour l'abonnement. */
import { supabase } from "@/integrations/supabase/client";
import { upgradePlan, type SubscriptionPlan } from "@/services/subscriptionService";

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  plan: string;
  provider: string;
  status: "pending" | "success" | "failed";
  transaction_id?: string | null;
  created_at?: string;
}

/** Crée un paiement simulé pour l'abonnement. */
export async function createPayment(userId: string, plan: SubscriptionPlan, amount: number): Promise<PaymentRecord> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      plan,
      amount,
      currency: "XOF",
      provider: "cinetpay",
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as PaymentRecord;
}

/** Simule le paiement réussi et active le plan correspondant. */
export async function simulatePaymentSuccess(paymentId: string): Promise<PaymentRecord> {
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError) throw paymentError;
  if (!payment) throw new Error("Paiement introuvable.");

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({
      status: "success",
      transaction_id: `demo_${paymentId.slice(0, 8)}`,
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (updateError) throw updateError;

  const durationMap: Record<string, number> = {
    trial: 7,
    mensuel: 30,
    annuel: 365,
  };

  await upgradePlan(payment.user_id as string, payment.plan as SubscriptionPlan, durationMap[payment.plan as string] ?? 30);

  return updated as PaymentRecord;
}

/** Récupère les paiements de l'utilisateur courant. */
export async function getMyPayments(): Promise<PaymentRecord[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}
