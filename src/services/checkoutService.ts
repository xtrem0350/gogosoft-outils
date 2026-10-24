import { BONUS_DAYS } from "@/constants/pricing";
import { notifyShopModulesChanged } from "@/hooks/useShopModules";
import { supabase } from "@/integrations/supabase/client";
import { assignDomain, createDomainRequest } from "@/services/domainService";
import {
  confirmPayment,
  createSubscriptionPayment,
  getPaymentInvoice,
} from "@/services/subscriptionPaymentService";
import { enableShopModules } from "@/services/moduleService";
import type { CheckoutSubmission } from "@/components/CheckoutModal";
import type { WelcomeDomainId } from "@/constants/welcomeDomains";
import { shopCodesFromModuleIds } from "@/types/modules";

interface CompleteSubscriptionCheckoutData {
  shopId: string;
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
}: CompleteSubscriptionCheckoutData) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Utilisateur non authentifié.");

  const payment = await createSubscriptionPayment({
    shopId,
    planId,
    planPrice,
    modules: domainIds,
    domainName: submission.domainName,
    subscriptionMonths: submission.subscriptionMonths,
    paymentMethod: submission.paymentMethod,
    domainPrice: submission.domainPrice,
  });
  await new Promise((resolve) => window.setTimeout(resolve, 2000));
  await confirmPayment(payment.id, `simulated_${payment.id}`);

  if (submission.domainPrice > 0) {
    const domainRequest = await createDomainRequest(shopId, submission.choices);
    await assignDomain(domainRequest.id, submission.domainName);
  }

  const moduleCodes = shopCodesFromModuleIds(domainIds);
  await enableShopModules(shopId, moduleCodes);
  notifyShopModulesChanged(shopId);

  const appCodes = moduleCodes.filter((code) => !code.startsWith("shop_"));
  const storefrontCodes = moduleCodes.filter((code) => code.startsWith("shop_"));
  const expiresAt = new Date(
    Date.now() +
      (submission.subscriptionMonths * 30 + BONUS_DAYS) * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userData.user.id,
      plan: "mensuel",
      status: "active",
      expires_at: expiresAt,
      selected_modules: appCodes,
      storefront_modules: storefrontCodes,
      domain_included: submission.domainPrice > 0,
      price_fcfa: planPrice,
    },
    { onConflict: "user_id" },
  );
  if (subscriptionError) throw subscriptionError;

  return getPaymentInvoice(payment.id);
}
