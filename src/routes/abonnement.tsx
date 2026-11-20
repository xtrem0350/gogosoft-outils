import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Globe, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { CheckoutModal, type CheckoutSubmission } from "@/components/CheckoutModal";
import { PageHero } from "@/components/PageHero";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BONUS_DAYS, DOMAIN_PRICE, WELCOME_PRICING } from "@/constants/pricing";
import { isWelcomeDomainId, WELCOME_DOMAIN_LABELS } from "@/constants/welcomeDomains";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import {
  checkDomainAvailability,
  createAdditionalDomainRequest,
  getCurrentDomainRequest,
  getDomainRequests,
  renewDomain,
  type DomainRequest,
} from "@/services/domainService";
import { isDemoMode } from "@/services/demoService";
import {
  confirmPayment,
  createSubscriptionPayment,
  getPaymentInvoice,
  type SubscriptionPaymentInvoice,
} from "@/services/subscriptionPaymentService";
import { getMySubscription, type SubscriptionSummary } from "@/services/subscriptionService";
import { moduleIdsFromShopCodes } from "@/types/modules";
import { enableShopModules, syncSubscriptionModules } from "@/services/moduleService";
import { notifyShopModulesChanged } from "@/hooks/useShopModules";

export const Route = createFileRoute("/abonnement")({
  validateSearch: (search: Record<string, unknown>) => ({
    activate: search["activate"] === "1" ? "1" : undefined,
  }),
  component: AbonnementPage,
});

type RenewalMode = "subscription" | "domain" | null;

function AbonnementPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobile) return;
    toast.info("Cette page est disponible sur ordinateur.");
    void navigate({ to: "/dashboard" });
  }, [isMobile, navigate]);

  if (isMobile) return null;

  return <AbonnementContent />;
}

function AbonnementContent() {
  const { activate } = Route.useSearch();
  const demo = isDemoMode();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { isOwner } = useUserRoles();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [domainRequest, setDomainRequest] = useState<DomainRequest | null>(null);
  const [domainRequests, setDomainRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalMode, setRenewalMode] = useState<RenewalMode>(null);
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [creatingDomainPayment, setCreatingDomainPayment] = useState(false);
  const [pendingDomainPayment, setPendingDomainPayment] =
    useState<SubscriptionPaymentInvoice | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [pendingModules, setPendingModules] = useState<string[]>([]);

  useEffect(() => {
    if (activate !== "1" || !shopId) return;
    try {
      const stored = sessionStorage.getItem("gogosoft.pendingModuleSelection");
      if (!stored) return;
      const selection = JSON.parse(stored) as { shopId?: string; modules?: string[] };
      if (selection.shopId !== shopId || !Array.isArray(selection.modules)) return;
      setPendingModules(selection.modules);
      setRenewalMode("subscription");
    } catch {
      sessionStorage.removeItem("gogosoft.pendingModuleSelection");
    }
  }, [activate, shopId]);

  async function refresh() {
    if (demo || !shopId) {
      setSubscription(await getMySubscription());
      setDomainRequest(null);
      setDomainRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextSubscription, nextDomain, nextDomains] = await Promise.all([
        getMySubscription(),
        getCurrentDomainRequest(shopId),
        getDomainRequests(shopId),
      ]);
      setSubscription(nextSubscription);
      setDomainRequest(nextDomain);
      setDomainRequests(nextDomains);
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
        : (subscription?.selected_modules.length ?? 0) > 1
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
    const modules = pendingModules.length > 0 ? pendingModules : [...subscription.selected_modules, ...subscription.storefront_modules];
    const payment = await createSubscriptionPayment({
      shopId,
      planId: plan.id,
      planPrice: plan.price,
      modules: renewalMode === "domain" ? [] : modules,
      domainName: domainRequest?.assigned_domain ?? "",
      subscriptionMonths: submission.subscriptionMonths,
      paymentMethod: submission.paymentMethod,
      domainPrice: renewalMode === "domain" ? DOMAIN_PRICE : 0,
      bonusDays: renewalMode === "domain" ? 0 : BONUS_DAYS,
      ...(submission.paymentMethod === "cash"
        ? { paymentStatus: "en_attente_paiement_espece" as const }
        : {}),
    });
    if (submission.paymentMethod === "cash") {
      return {
        success: true,
        pending: true,
        message: "Renouvellement en attente de validation.",
        invoice: payment,
      };
    }

    // TODO sprint 4 : remplacer cette simulation pour les paiements non-espèces.
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
      const appCodes = modules.filter((code) => !code.startsWith("shop_"));
      const storefrontCodes = modules.filter((code) => code.startsWith("shop_"));
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan: "mensuel",
          status: "active",
          expires_at: renewalStart.toISOString(),
          selected_modules: appCodes,
          storefront_modules: storefrontCodes,
          domain_included: subscription.domain_included,
          price_fcfa: renewalPlan.price,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      if (pendingModules.length > 0) {
        await enableShopModules(shopId, pendingModules);
        await syncSubscriptionModules(pendingModules);
        notifyShopModulesChanged(shopId);
        sessionStorage.removeItem("gogosoft.pendingModuleSelection");
      }
    }
    return getPaymentInvoice(payment.id);
  }

  async function submitAdditionalDomain() {
    if (!isOwner || demo || !shopId || !subscription?.isActive) {
      toast.error("Un abonnement actif du propriétaire est requis pour ajouter un domaine.");
      return;
    }
    const trimmedName = newDomainName.trim().toLowerCase();
    if (!trimmedName) {
      toast.error("Saisissez le nom du domaine souhaité.");
      return;
    }

    setCreatingDomainPayment(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Utilisateur non authentifié.");

      const domain = trimmedName.endsWith(".ci") ? trimmedName : `${trimmedName}.ci`;
      if (!(await checkDomainAvailability(domain))) {
        throw new Error("Ce nom de domaine n'est pas disponible.");
      }
      const request = await createAdditionalDomainRequest(
        authData.user.id,
        shopId,
        domain,
      );
      const payment = await createSubscriptionPayment({
        shopId,
        planId: "domain-additional",
        planPrice: 0,
        modules: [],
        domainName: request.choice_1,
        subscriptionMonths: 1,
        paymentMethod: "cash",
        domainPrice: DOMAIN_PRICE,
        bonusDays: 0,
        paymentStatus: "en_attente_paiement_espece",
      });
      setPendingDomainPayment(payment);
      setAddDomainOpen(false);
      setNewDomainName("");
      toast.success("Demande créée. Le domaine sera ajouté après validation du paiement.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la demande de domaine.");
    } finally {
      setCreatingDomainPayment(false);
    }
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
                  <p><strong>Statut :</strong> {subscription?.status === "trial"
                    ? "Essai"
                    : subscription?.status === "active"
                      ? "Actif"
                      : subscription?.status === "pending"
                        ? "En attente"
                        : subscription?.status === "inactive"
                          ? "Inactif"
                          : subscription?.status === "cancelled"
                            ? "Annulé"
                            : "Expiré"}</p>
                  {!demo ? (
                    <Button
                      onClick={() => setRenewalMode("subscription")}
                      className="mt-2 w-full"
                    >
                      <RefreshCw className="size-4" />
                      Confirmer le renouvellement
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
                <div className="flex flex-wrap gap-2">
                  {!demo ? (
                    <Button
                      variant="outline"
                      disabled={!domainRequest?.assigned_domain}
                      onClick={() => setRenewalMode("domain")}
                    >
                      Renouveler le domaine · {DOMAIN_PRICE.toLocaleString("fr-FR")} FCFA
                    </Button>
                  ) : null}
                  {isOwner && subscription?.isActive && !demo ? (
                    <Button type="button" onClick={() => setAddDomainOpen(true)}>
                      <Plus className="size-4" />
                      Ajouter un domaine
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            {domainRequests.length > 0 ? (
              <Card>
                <CardHeader><CardTitle>Domaines de la boutique</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {domainRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <span className="font-medium">
                        {request.assigned_domain ?? request.choice_1}
                      </span>
                      <span className="capitalize text-muted-foreground">
                        {request.status === "pending" ? "En attente de traitement" : request.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
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
          onClose={() => {
            setRenewalMode(null);
            if (activate === "1") sessionStorage.removeItem("gogosoft.pendingModuleSelection");
          }}
          plan={checkoutPlan}
          selectedDomainIds={renewalMode === "domain" ? [] : selectedDomainIds}
          domainRequired={false}
          initialDomain={domainRequest?.assigned_domain ?? ""}
          domainPrice={renewalMode === "domain" ? DOMAIN_PRICE : 0}
          clientName={clientName}
          clientEmail={clientEmail}
          cashActionLabel="Confirmer le renouvellement"
          cashConfirmationTitle={
            renewalMode === "domain"
              ? "Renouvellement du domaine en attente de validation"
              : "Renouvellement en attente de validation"
          }
          cashConfirmationMessage="Le renouvellement sera appliqué après réception et validation du paiement en espèces. Contactez l'administrateur."
          onPay={processRenewal}
          onComplete={() => {
            setRenewalMode(null);
            void refresh();
          }}
        />
      ) : null}
      <Dialog
        open={addDomainOpen}
        onOpenChange={(open) => {
          if (!creatingDomainPayment) setAddDomainOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un domaine</DialogTitle>
            <DialogDescription>
              Le nouveau domaine sera activé après validation du paiement en espèces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additional-domain-name">Nom de domaine souhaité</Label>
              <Input
                id="additional-domain-name"
                value={newDomainName}
                onChange={(event) => setNewDomainName(event.target.value)}
                placeholder="monatelier2"
                autoComplete="off"
                disabled={creatingDomainPayment}
              />
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p><strong>Durée :</strong> renouvellement 1 an</p>
              <p className="mt-1">
                <strong>Prix :</strong> {DOMAIN_PRICE.toLocaleString("fr-FR")} FCFA
              </p>
              <p className="mt-2 text-muted-foreground">Paiement à effectuer en espèces.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={creatingDomainPayment}
              onClick={() => setAddDomainOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={creatingDomainPayment || !newDomainName.trim()}
              onClick={() => void submitAdditionalDomain()}
            >
              {creatingDomainPayment ? "Création…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingDomainPayment !== null}
        onOpenChange={(open) => !open && setPendingDomainPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajout du domaine en attente de validation</DialogTitle>
            <DialogDescription>
              Le domaine sera ajouté après réception et validation du paiement en espèces.
            </DialogDescription>
          </DialogHeader>
          {pendingDomainPayment ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p>Facture : <strong>{pendingDomainPayment.invoice_number}</strong></p>
              <p className="mt-1">
                Montant :{" "}
                <strong>
                  {pendingDomainPayment.total_amount.toLocaleString("fr-FR")} FCFA
                </strong>
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" onClick={() => setPendingDomainPayment(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
