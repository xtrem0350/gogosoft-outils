import { supabase } from "@/integrations/supabase/client";
import type {
  CheckoutPaymentResult,
  PendingCashCheckoutResult,
} from "@/services/subscriptionPaymentService";
import type { CheckoutSubmission } from "@/components/CheckoutModal";
import type { WelcomeDomainId } from "@/constants/welcomeDomains";
import { shopCodesFromModuleIds } from "@/types/modules";

interface CompleteSubscriptionCheckoutData {
  shopId: string | null;
  planId: string;
  planPrice: number;
  domainIds: WelcomeDomainId[];
  submission: CheckoutSubmission;
}

export async function completeSubscriptionCheckout({
  shopId,
  planId,
  planPrice,
  domainIds,
  submission,
}: CompleteSubscriptionCheckoutData): Promise<CheckoutPaymentResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Utilisateur non authentifié.");

  const allowedMethods = ["cash", "wave", "orange_money", "mtn_momo"] as const;
  if (!allowedMethods.includes(submission.paymentMethod as (typeof allowedMethods)[number])) {
    throw new Error("Mode de paiement invalide.");
  }
  if (submission.paymentMethod !== "cash" && !submission.paymentReference?.trim()) {
    throw new Error("La référence de transaction est obligatoire.");
  }

  const { data: existingSubscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  const paymentType =
    existingSubscription?.status === "active" ||
    existingSubscription?.status === "trial" ||
    existingSubscription?.status === "expired" ||
    existingSubscription?.status === "inactive"
      ? "renouvellement"
      : "souscription";

  const moduleCodes = shopCodesFromModuleIds(domainIds);
  const totalAmount =
    planPrice * submission.subscriptionMonths +
    submission.domainPrice +
    submission.additionalAmount;

  const { data: invoice, error: invoiceError } = await supabase
    .from("subscription_invoices")
    .insert({
      user_id: userData.user.id,
      shop_id: shopId || null,
      plan_id: planId,
      lines: {
        modules: domainIds,
        module_codes: moduleCodes,
        plan_price: planPrice,
        domain_name: submission.domainName,
        domain_price: submission.domainPrice,
        additional_amount: submission.additionalAmount,
        duration_days: submission.subscriptionMonths * 30,
      },
      total_amount: totalAmount,
      payment_method: submission.paymentMethod,
      payment_status: "en_attente_paiement_espece",
      payment_reference: submission.paymentReference?.trim() || null,
      payment_type: paymentType,
      duration_days: submission.subscriptionMonths * 30,
    })
    .select("*")
    .single();
  if (invoiceError) throw invoiceError;

  const result: PendingCashCheckoutResult = {
    success: true,
    pending: true,
    message: "Facture créée. En attente de validation.",
    invoice: {
      id: invoice.id,
      invoice_number: invoice.id,
      shop_id: invoice.shop_id,
      user_id: invoice.user_id,
      plan_id: invoice.plan_id,
      lines: {
        modules: domainIds,
        module_codes: moduleCodes,
        plan_price: planPrice,
        domain_name: submission.domainName || null,
        domain_price: submission.domainPrice,
        additional_amount: submission.additionalAmount,
        duration_days: submission.subscriptionMonths * 30,
      },
      duration_days: submission.subscriptionMonths * 30,
      total_amount: invoice.total_amount,
      payment_method: invoice.payment_method,
      payment_status: "en_attente_paiement_espece",
      payment_reference: invoice.payment_reference,
      paid_at: null,
      payment_type: paymentType,
    },
  };
  return result;
}
