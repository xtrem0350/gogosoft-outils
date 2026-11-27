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
import { DOMAIN_PRICE, WELCOME_PRICING } from "@/constants/pricing";
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
  type DomainRequest,
} from "@/services/domainService";
import { isDemoMode } from "@/services/demoService";
import type {
  PendingCashCheckoutResult,
  SubscriptionPaymentInvoice,
} from "@/services/subscriptionPaymentService";
import { getMySubscription, type SubscriptionSummary } from "@/services/subscriptionService";
import { moduleIdsFromShopCodes, shopCodesFromModuleIds, type ModuleId } from "@/types/modules";

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
  const [pendingModules, setPendingModules] = useState<ModuleId[]>([]);

  useEffect(() => {
    if (activate !== "1" || !shopId) return;
    try {
      const stored = sessionStorage.getItem("gogosoft.pendingModuleSelection");
      if (!stored) return;
      const selection = JSON.parse(stored) as { shopId?: string; modules?: string[] };
      if (selection.shopId !== shopId || !Array.isArray(selection.modules)) return;
      setPendingModules(selection.modules.filter(isWelcomeDomainId) as ModuleId[]);
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

  async function processRenewal(
    submission: CheckoutSubmission,
  ): Promise<PendingCashCheckoutResult> {
    if (!shopId || !renewalMode) throw new Error("Atelier introuvable.");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData.user;
    if (!user) throw new Error("Utilisateur non authentifié.");

    const plan = renewalMode === "domain"
      ? { id: "domain-renewal", price: 0 }
      : { id: renewalPlan.id, price: renewalPlan.price };

    const modules: ModuleId[] =
      pendingModules.length > 0
        ? pendingModules
        : [
            ...moduleIdsFromShopCodes(subscription?.selected_modules ?? []),
            ...moduleIdsFromShopCodes(subscription?.storefront_modules ?? []),
          ].filter(isWelcomeDomainId);

    if (submission.paymentMethod !== "cash" && !submission.paymentReference?.trim()) {
      throw new Error("La référence de transaction est obligatoire.");
    }

    const totalAmount =
      plan.price * submission.subscriptionMonths +
      (renewalMode === "domain" ? DOMAIN_PRICE : 0) +
      submission.additionalAmount;
    const durationDays =
      renewalMode === "domain" ? 365 : submission.subscriptionMonths * 30;
    const paymentType =
      renewalMode === "domain"
        ? "renouvellement"
        : pendingModules.length > 0 && subscription?.isActive
          ? "ajout_module"
          : subscription
            ? "renouvellement"
            : "souscription";
    const moduleCodes: string[] =
      renewalMode === "domain"
        ? []
        : pendingModules.length > 0
          ? shopCodesFromModuleIds(pendingModules.filter(isWelcomeDomainId))
          : shopCodesFromModuleIds(modules);

    const { data: invoice, error: invoiceError } = await supabase
      .from("subscription_invoices")
      .insert({
        user_id: user.id,
        shop_id: shopId,
        plan_id: plan.id,
        lines: {
          modules: renewalMode === "domain" ? [] : modules,
          module_codes: moduleCodes,
          domain_name: domainRequest?.assigned_domain ?? submission.domainName,
          plan_price: plan.price,
          domain_price: renewalMode === "domain" ? DOMAIN_PRICE : 0,
          additional_amount: submission.additionalAmount,
          duration_days: durationDays,
        },
        total_amount: totalAmount,
        payment_method: submission.paymentMethod,
        payment_status: "en_attente_paiement_espece",
        payment_reference: submission.paymentReference?.trim() || null,
        payment_type: paymentType,
        duration_days: durationDays,
      })
      .select("*")
      .single();
    if (invoiceError) throw invoiceError;

    const payment: SubscriptionPaymentInvoice = {
      id: invoice.id,
      invoice_number: invoice.id,
      shop_id: invoice.shop_id,
      user_id: invoice.user_id,
      plan_id: invoice.plan_id,
      lines: {
        modules: renewalMode === "domain" ? [] : modules,
        module_codes: moduleCodes,
        plan_price: plan.price,
        domain_name: domainRequest?.assigned_domain ?? (submission.domainName || null),
        domain_price: renewalMode === "domain" ? DOMAIN_PRICE : 0,
        additional_amount: submission.additionalAmount,
        duration_days: durationDays,
      },
      duration_days: durationDays,
      total_amount: invoice.total_amount,
      payment_method: invoice.payment_method,
      payment_status: "en_attente_paiement_espece",
      payment_reference: invoice.payment_reference,
      paid_at: null,
      payment_type: paymentType,
    };
    return {
      success: true,
      pending: true,
      message: "Facture créée. En attente de validation.",
      invoice: payment,
    };
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
      const { data: invoice, error: invoiceError } = await supabase
        .from("subscription_invoices")
        .insert({
          user_id: authData.user.id,
          shop_id: shopId,
          plan_id: "domain-additional",
          lines: {
            modules: [],
            module_codes: [],
            domain_name: request.choice_1,
            plan_price: 0,
            domain_price: DOMAIN_PRICE,
            additional_amount: 0,
            duration_days: 365,
          },
          total_amount: DOMAIN_PRICE,
          payment_method: "cash",
          payment_status: "en_attente_paiement_espece",
          payment_reference: null,
          payment_type: "ajout_module",
          duration_days: 365,
        })
        .select("*")
        .single();
      if (invoiceError) throw invoiceError;

      setPendingDomainPayment({
        id: invoice.id,
        invoice_number: invoice.id,
        shop_id: shopId,
        user_id: authData.user.id,
        plan_id: "domain-additional",
        lines: {
          modules: [],
          module_codes: [],
          plan_price: 0,
          domain_name: request.choice_1,
          domain_price: DOMAIN_PRICE,
          additional_amount: 0,
          duration_days: 365,
        },
        duration_days: 365,
        total_amount: DOMAIN_PRICE,
        payment_method: "cash",
        payment_status: "en_attente_paiement_espece",
        payment_reference: null,
        paid_at: null,
        payment_type: "ajout_module",
      });
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
        imageSrc={new URL("../assets/images/hero-owner-espace-atelier.jpg", import.meta.url).href}
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
                      {subscription ? "Confirmer le renouvellement" : "Souscrire"}
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
                  Choisissez 1 ou 3 mois lors du paiement. Chaque mois correspond à 30 jours d&apos;abonnement.
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

      {renewalMode ? (
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
          cashActionLabel={subscription ? "Confirmer le renouvellement" : "Confirmer la souscription"}
          cashConfirmationTitle={
            renewalMode === "domain"
              ? "Renouvellement du domaine en attente de validation"
              : subscription
                ? "Renouvellement en attente de validation"
                : "Souscription en attente de validation"
          }
          cashConfirmationMessage="Votre accès sera activé après réception et validation du paiement. Contactez l'administrateur si nécessaire."
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