import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { CheckoutModal, type CheckoutSubmission } from "@/components/CheckoutModal";
import { PageHero } from "@/components/PageHero";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BONUS_DAYS, DOMAIN_PRICE, WELCOME_PRICING } from "@/constants/pricing";
import { isWelcomeDomainId, WELCOME_DOMAIN_LABELS } from "@/constants/welcomeDomains";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentDomainRequest, renewDomain, type DomainRequest } from "@/services/domainService";
import { isDemoMode } from "@/services/demoService";
import { confirmPayment, createSubscriptionPayment, getPaymentInvoice } from "@/services/subscriptionPaymentService";
import { getMySubscription, type SubscriptionSummary } from "@/services/subscriptionService";
import { moduleIdsFromShopCodes } from "@/types/modules";

export const Route = createFileRoute("/abonnement")({ component: AbonnementPage });

type RenewalMode = "subscription" | "domain" | null;

function AbonnementPage() {
  const demo = isDemoMode();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [domainRequest, setDomainRequest] = useState<DomainRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewalMode, setRenewalMode] = useState<RenewalMode>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  async function refresh() {
    if (demo || !shopId) {
      setSubscription(await getMySubscription());
      setDomainRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextSubscription, nextDomain] = await Promise.all([
        getMySubscription(),
        getCurrentDomainRequest(shopId),
      ]);
      setSubscription(nextSubscription);
      setDomainRequest(nextDomain);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setClientName(
        typeof authData.user?.user_metadata["full_name"] === "string"
          ? authData.user.user_metadata["full_name"]
          : "",
      );
      setClientEmail(authData.user?.email ?? "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger votre abonnement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (shopLoading) return;
    void refresh();
  }, [shopId, shopLoading, demo]);

  const selectedDomainIds = useMemo(() => {
    if (!subscription) return [];
    return moduleIdsFromShopCodes([
      ...subscription.selected_modules,
      ...subscription.storefront_modules,
    ]).filter(isWelcomeDomainId);
  }, [subscription]);

  const renewalPlan = useMemo(() => {
    const fallbackPlan =
      subscription?.storefront_modules.length && !subscription.selected_modules.length
        ? WELCOME_PRICING.find((plan) => plan.id === "shop_1")
        : subscription?.selected_modules.length > 1
          ? WELCOME_PRICING.find((plan) => plan.id === "app_3")
          : WELCOME_PRICING.find((plan) => plan.id === "app_1");
    const fallback = fallbackPlan ?? WELCOME_PRICING[0]!;
    return {
      ...fallback,
      id: subscription?.plan ?? fallback.id,
      title: subscription?.plan === "trial" ? fallback.title : `Renouvellement · ${fallback.title}`,
      price: subscription?.price_fcfa || fallback.price,
      subtitle: "Renouvellement mensuel",
    };
  }, [subscription]);

  async function processRenewal(submission: CheckoutSubmission) {
    if (!shopId || !subscription || !renewalMode) {
      throw new Error("Atelier ou abonnement introuvable.");
    }
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData.user;
    if (!user) throw new Error("Utilisateur non authentifié.");

    const plan = renewalMode === "domain"
      ? { id: "domain-renewal", price: 0 }
      : { id: renewalPlan.id, price: renewalPlan.price };
    const payment = await createSubscriptionPayment({
      shopId,
      planId: plan.id,
      planPrice: plan.price,
      modules: renewalMode === "domain"
        ? []
        : [...subscription.selected_modules, ...subscription.storefront_modules],
      domainName: domainRequest?.assigned_domain ?? "",
      subscriptionMonths: submission.subscriptionMonths,
      paymentMethod: submission.paymentMethod,
      domainPrice: renewalMode === "domain" ? DOMAIN_PRICE : 0,
      bonusDays: renewalMode === "domain" ? 0 : BONUS_DAYS,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
    await confirmPayment(payment.id, `simulated_${payment.id}`);

    if (renewalMode === "domain") {
      if (!domainRequest) throw new Error("Aucun domaine à renouveler.");
      await renewDomain(domainRequest.id);
    } else {
      const currentExpiry = subscription.expires_at ? new Date(subscription.expires_at) : new Date();
      const now = new Date();
      const renewalStart = currentExpiry > now ? currentExpiry : now;
      renewalStart.setDate(renewalStart.getDate() + submission.subscriptionMonths * 30 + BONUS_DAYS);
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan: "mensuel",
          status: "active",
          expires_at: renewalStart.toISOString(),
          selected_modules: subscription.selected_modules,
          storefront_modules: subscription.storefront_modules,
          domain_included: subscription.domain_included,
          price_fcfa: renewalPlan.price,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    }
    return getPaymentInvoice(payment.id);
  }

  const checkoutPlan = renewalMode === "domain"
    ? {
        id: "domain-renewal",
        title: "Renouvellement du domaine",
        price: 0,
        subtitle: "Renouvellement annuel",
        features: [],
      }
    : renewalPlan;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHero
        title="Gestion de l'abonnement"
        subtitle="Suivez votre accès, vos domaines et vos renouvellements."
        icon={CreditCard}
        iconColor="green"
        breadcrumb={[{ label: "Accueil", to: "/dashboard" }, { label: "Mon forfait" }]}
      />

      {loading || shopLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Chargement de votre abonnement…</CardContent></Card>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Mon abonnement actuel</h2>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <SubscriptionCard subscription={subscription} />
              <Card>
                <CardHeader><CardTitle>Détails de l&apos;abonnement</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Plan :</strong> {subscription?.plan ?? "Aucun"}</p>
                  <p><strong>Domaines :</strong> {selectedDomainIds.length
                    ? selectedDomainIds.map((id) => WELCOME_DOMAIN_LABELS[id]).join(", ")
                    : "Aucun domaine enregistré"}</p>
                  <p><strong>Expiration :</strong> {subscription?.expires_at
                    ? new Date(subscription.expires_at).toLocaleDateString("fr-FR")
                    : "Non définie"}</p>
                  <p><strong>Statut :</strong> {subscription?.isActive ? "Actif" : "Expiré"}</p>
                  {!demo ? (
                    <Button onClick={() => setRenewalMode("subscription")} className="mt-2 w-full">
                      <RefreshCw className="size-4" />
                      Renouveler l&apos;abonnement
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold">Mon domaine</h2>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <Globe className="size-4 text-orange-600" />
                    {domainRequest?.assigned_domain ?? "Aucun domaine .ci actif"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expiration : {domainRequest?.expires_at
                      ? new Date(domainRequest.expires_at).toLocaleDateString("fr-FR")
                      : "Non définie"}
                  </p>
                </div>
                {!demo ? (
                  <Button
                    variant="outline"
                    disabled={!domainRequest?.assigned_domain}
                    onClick={() => setRenewalMode("domain")}
                  >
                    Renouveler le domaine · {DOMAIN_PRICE.toLocaleString("fr-FR")} FCFA
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold">Renouveler l&apos;abonnement</h2>
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm text-muted-foreground">
                  Choisissez 1 ou 3 mois lors du paiement. Chaque renouvellement inclut {BONUS_DAYS} jours offerts.
                </p>
                {!demo ? (
                  <Button onClick={() => setRenewalMode("subscription")}>
                    <CreditCard className="size-4" /> Choisir la durée et payer
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Les paiements ne sont pas disponibles en mode démo.</p>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {renewalMode && subscription ? (
        <CheckoutModal
          open={renewalMode !== null}
          onClose={() => setRenewalMode(null)}
          plan={checkoutPlan}
          selectedDomainIds={renewalMode === "domain" ? [] : selectedDomainIds}
          domainRequired={false}
          initialDomain={domainRequest?.assigned_domain ?? ""}
          domainPrice={renewalMode === "domain" ? DOMAIN_PRICE : 0}
          clientName={clientName}
          clientEmail={clientEmail}
          onPay={processRenewal}
          onComplete={() => {
            setRenewalMode(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}
