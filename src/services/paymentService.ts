/** Services de gestion des paiements de démonstration pour l'abonnement. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import type { SubscriptionPlan } from "@/services/subscriptionService";

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
export async function createPayment(
  userId: string,
  plan: SubscriptionPlan,
  amount: number,
): Promise<PaymentRecord> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
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

/** Récupère les paiements de l'utilisateur courant. */
export async function getMyPayments(): Promise<PaymentRecord[]> {
  const hasSession = await hasActiveSession();
  console.log("[paymentService] called", { hasSession, shopId: null });
  if (!hasSession) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}
