import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Banknote, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Smartphone, Waves } from "lucide-react";
import { toast } from "sonner";

import authLogo from "@/assets/images/leprofile.png";
import {
  calculateModulePrice,
  countRepairModules,
  countSaleModules,
  DOMAIN_PRICE,
  INSTALLATION_NOTICE,
  isAllInOne,
  PRICING_RULES,
  type PricingMode,
  type PricingPlan,
} from "@/constants/pricing";
import {
  isWelcomeDomainId,
  WELCOME_DOMAIN_LABELS,
  type WelcomeDomainId,
} from "@/constants/welcomeDomains";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DomainChoice } from "@/services/domainService";
import type {
  CheckoutPaymentResult,
  SubscriptionPaymentInvoice,
} from "@/services/subscriptionPaymentService";

type PaymentMethod = "cash" | "wave" | "orange_money" | "mtn_momo";
type CheckoutStep = 1 | 2 | 3;

export interface CheckoutSubmission {
  domainName: string;
  choices: DomainChoice;
  planPrice: number;
  additionalAmount: number;
  subscriptionMonths: 1 | 3;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  domainPrice: number;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  plan: PricingPlan;
  selectedDomainIds: WelcomeDomainId[];
  domainRequired: boolean;
  initialDomain?: string;
  domainPrice?: number;
  initialMonths?: 1 | 3;
  clientName: string;
  clientEmail: string;
  cashActionLabel?: string;
  cashConfirmationTitle?: string;
  cashConfirmationMessage?: string;
  onPay: (submission: CheckoutSubmission) => Promise<CheckoutPaymentResult>;
  onComplete: () => void | Promise<void>;
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  icon: typeof Waves;
}> = [
  { id: "cash", label: "Espèces", icon: Banknote },
  { id: "wave", label: "Wave", icon: Waves },
  { id: "orange_money", label: "Orange Money", icon: Smartphone },
  { id: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
];

const PRICING_MODE_STORAGE_KEY = "gogosoft.welcome.pricingMode";
const SELECTED_MODULES_STORAGE_KEY = "gogosoft.welcome.selectedModules";

function readStoredPricingSelection(): {
  mode: Exclude<PricingMode, null>;
  modules: WelcomeDomainId[];
} | null {
  if (typeof window === "undefined") return null;
  const mode = window.sessionStorage.getItem(PRICING_MODE_STORAGE_KEY);
  if (mode !== "all_in_one" && mode !== "modules") return null;

  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(SELECTED_MODULES_STORAGE_KEY) ?? "[]",
    );
    return {
      mode,
      modules: Array.isArray(parsed) ? parsed.filter(isWelcomeDomainId) : [],
    };
  } catch (error) {
    console.error("[Checkout] Impossible de lire la sélection tarifaire.", error);
    return null;
  }
}

export function CheckoutModal({
  open,
  onClose,
  plan,
  selectedDomainIds,
  domainRequired,
  initialDomain = "",
  domainPrice = domainRequired ? DOMAIN_PRICE : 0,
  initialMonths = 1,
  clientName,
  clientEmail,
  cashActionLabel = "Confirmer la commande",
  cashConfirmationTitle = "Votre boutique est créée.",
  cashConfirmationMessage = "Votre abonnement sera activé après réception et validation de votre paiement. Contactez l'administrateur si nécessaire.",
  onPay,
  onComplete,
}: CheckoutModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>(domainRequired ? 1 : 2);
  const [assignedDomain, setAssignedDomain] = useState(initialDomain);
  const [months, setMonths] = useState<1 | 3>(initialMonths);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<SubscriptionPaymentInvoice | null>(null);
  const [cashConfirmation, setCashConfirmation] = useState(false);
  const [smsPackChecked, setSmsPackChecked] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(domainRequired ? 1 : 2);
    setAssignedDomain(initialDomain);
    setMonths(initialMonths);
    setMethod("cash");
    setProcessing(false);
    setInvoice(null);
    setCashConfirmation(false);
    setSmsPackChecked(false);
    setPaymentReference("");
  }, [domainRequired, initialDomain, initialMonths, open]);

  const storedPricing = readStoredPricingSelection();
  const pricingMode = domainRequired ? storedPricing?.mode ?? null : null;
  const activityModuleIds = (storedPricing?.modules ?? selectedDomainIds).filter(
    (id) => id.startsWith("reparation-") || id.startsWith("vente-"),
  );
  const moduleCount = activityModuleIds.length;
  const repairModuleCount = countRepairModules(activityModuleIds);
  const saleModuleCount = countSaleModules(activityModuleIds);
  const repairModulePrice = calculateModulePrice(repairModuleCount);
  const saleModulePrice = calculateModulePrice(saleModuleCount);
  const planPrice =
    pricingMode === "all_in_one"
      ? PRICING_RULES.allInOne.price
      : pricingMode === "modules"
        ? repairModulePrice + saleModulePrice
        : plan.price;
  const checkoutDomainPrice = pricingMode ? PRICING_RULES.domainPrice : domainPrice;
  const checkoutPlanTitle =
    pricingMode === "all_in_one"
      ? PRICING_RULES.allInOne.title
      : pricingMode === "modules"
        ? PRICING_RULES.moduleTitle
        : plan.title;
  const totalAmount = pricingMode
    ? planPrice + checkoutDomainPrice + (smsPackChecked ? PRICING_RULES.smsPackPrice : 0)
    : plan.price * months + domainPrice + (smsPackChecked ? PRICING_RULES.smsPackPrice : 0);
  const billedMonths = pricingMode ? 1 : months;
  const selectedMethod = PAYMENT_METHODS.find((item) => item.id === method) ?? PAYMENT_METHODS[0]!;

  async function submitPayment() {
    if (method !== "cash" && !paymentReference.trim()) {
      toast.error("La référence de transaction est obligatoire.");
      return;
    }
    if ((domainRequired || domainPrice > 0) && !assignedDomain.trim()) {
      toast.error("Saisissez le nom de domaine.");
      setStep(1);
      return;
    }

    setProcessing(true);
    try {
      const domainName = assignedDomain.trim();
      const submission: CheckoutSubmission = {
        domainName,
        choices: {
          choice_1: domainName,
          choice_2: "",
          choice_3: "",
        },
        planPrice,
        additionalAmount: smsPackChecked ? PRICING_RULES.smsPackPrice : 0,
        subscriptionMonths: billedMonths,
        paymentMethod: method,
        paymentReference: method === "cash" ? null : paymentReference.trim(),
        domainPrice: checkoutDomainPrice,
      };
      const result = await onPay(submission);
      if ("invoice" in result) {
        setInvoice(result.invoice);
        setCashConfirmation(true);
        return;
      }
      setInvoice(result);
      await onComplete();
    } catch (error) {
      console.error("[Checkout] Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Le paiement n'a pas pu être finalisé.");
    } finally {
      setProcessing(false);
    }
  }

  async function continueAfterCashOrder() {
    setProcessing(true);
    try {
      await onComplete();
    } catch (error) {
      console.error("[Checkout] Completion error:", error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de terminer la commande.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function printInvoice() {
    window.print();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && !processing && !invoice && onClose()}
    >
      <DialogContent className="h-auto max-h-[90vh] w-full max-w-4xl overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-4xl [&>button]:z-20 [&>button]:text-slate-700">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .invoice-print, .invoice-print * { visibility: visible !important; }
            .invoice-print { position: fixed; inset: 0; overflow: visible; padding: 24px; background: white; }
          }
        `}</style>
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-auto sm:flex-row">
          <aside className="flex w-full shrink-0 flex-col justify-between gap-5 bg-slate-900 p-6 text-white sm:w-1/3 sm:p-8">
            <div>
              <img src={authLogo} alt="GogoSoft" className="mb-5 size-16 rounded-full border-2 border-white/20 object-cover" />
              <p className="text-sm font-medium text-blue-300">
                {method === "cash" ? "Paiement en espèces" : "Paiement mobile manuel"}
              </p>
              <h2 className="mt-2 text-3xl font-bold">Finalisez votre abonnement</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Votre espace et vos domaines seront activés après confirmation du paiement.
              </p>
            </div>

            {invoice ? (
              cashConfirmation ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => void continueAfterCashOrder()}
                    disabled={processing}
                    className="min-h-12 w-full"
                  >
                    Continuer vers Dashboard
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button type="button" onClick={printInvoice} className="min-h-12 w-full">
                    Télécharger PDF / Imprimer
                  </Button>
                  <Button type="button" onClick={() => void navigate({ to: "/dashboard" })} className="min-h-12 w-full">
                    Continuer
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Étape {step} sur 3</p>
                {step === 1 ? (
                  <Button
                    type="button"
                    className="min-h-11 w-full"
                    onClick={onClose}
                    disabled={processing}
                  >
                    Annuler
                  </Button>
                ) : null}
                {step === 2 && domainRequired ? (
                  <Button type="button" onClick={() => setStep(1)} className="min-h-11 w-full">
                    <ChevronLeft className="size-4" />
                    Modifier les domaines
                  </Button>
                ) : null}
                {step === 3 ? (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={() => void submitPayment()}
                      disabled={processing}
                      className="min-h-12 w-full bg-ivoirien text-white shadow-3d hover:bg-ivoirien-hover"
                    >
                      {processing ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <selectedMethod.icon className="size-4" />
                          {method === "cash"
                            ? cashActionLabel
                            : `Confirmer la commande — ${totalAmount.toLocaleString("fr-FR")} FCFA`}
                        </>
                      )}
                    </Button>
                    <Button type="button" onClick={() => setStep(2)} disabled={processing} className="min-h-11 w-full">
                      <ChevronLeft className="size-4" />
                      Retour au récapitulatif
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
            <p className="text-xs text-slate-400">© 2026 GogoSoft · Solution ivoirienne</p>
          </aside>

          <section className="min-h-0 w-full overflow-y-auto overflow-x-hidden bg-white p-6 sm:w-2/3 sm:p-8">
            {pricingMode && !invoice ? (
              <p className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm leading-6 text-green-900">
                {INSTALLATION_NOTICE}
              </p>
            ) : null}
            {cashConfirmation && invoice ? (
              <div className="flex h-full min-h-[420px] items-center justify-center text-center">
                <div className="max-w-xl space-y-5">
                  <CheckCircle2 className="mx-auto size-20 text-green-600" />
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-slate-900">
                      {cashConfirmationTitle}
                    </h3>
                    <p className="text-lg text-slate-600">
                      {cashConfirmationMessage}
                    </p>
                    <p className="text-sm text-slate-600">
                      Facture : <strong>{invoice.invoice_number}</strong>
                      <br />
                      Montant : <strong>{invoice.total_amount.toLocaleString("fr-FR")} FCFA</strong>
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void continueAfterCashOrder()}
                    disabled={processing}
                    className="min-h-12 w-full"
                  >
                    Continuer vers Dashboard
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : invoice ? (
              <div className="invoice-print space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    GogoSoft - Facture {invoice.invoice_number}
                  </DialogTitle>
                  <DialogDescription>
                    {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-2xl border p-5 text-sm">
                  <p className="font-semibold">{clientName || "Client"}</p>
                  <p className="text-slate-600">{clientEmail}</p>
                  <dl className="mt-5 space-y-3">
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <dt>Plan : {checkoutPlanTitle}</dt>
                      <dd>
                        {invoice.lines.plan_price.toLocaleString("fr-FR")} FCFA ×{" "}
                        {invoice.plan_id === "domain-renewal" ||
                        invoice.plan_id === "domain-additional"
                          ? "1 an"
                          : `${invoice.duration_days / 30} mois`}
                      </dd>
                    </div>
                    <div className="border-t pt-3">
                      <dt className="font-medium">Domaines</dt>
                      <dd className="mt-1 text-slate-600">
                        {selectedDomainIds.map((id) => WELCOME_DOMAIN_LABELS[id]).join(", ") ||
                          invoice.lines.modules.join(", ")}
                      </dd>
                    </div>
                    {invoice.lines.domain_name ? (
                      <div className="flex justify-between gap-4 border-t pt-3">
                        <dt>Domaine : {invoice.lines.domain_name}</dt>
                        <dd>{invoice.lines.domain_price.toLocaleString("fr-FR")} FCFA</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <dt>Durée</dt>
                      <dd>
                        {invoice.plan_id === "domain-renewal" ||
                        invoice.plan_id === "domain-additional"
                          ? "1 an"
                          : `${invoice.duration_days / 30} mois (${invoice.duration_days} jours)`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
                      <dt>TOTAL</dt>
                      <dd>{invoice.total_amount.toLocaleString("fr-FR")} FCFA</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <dt>Méthode</dt>
                      <dd>{PAYMENT_METHODS.find((item) => item.id === invoice.payment_method)?.label ?? invoice.payment_method}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <dt>Statut</dt>
                      <dd className="font-semibold text-green-700">PAYÉ</dd>
                    </div>
                  </dl>
                </div>
                <Button type="button" onClick={printInvoice} className="print:hidden">
                  Télécharger PDF / Imprimer
                </Button>
              </div>
            ) : (
              <>
                {step === 1 ? (
                  <>
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold text-slate-900">Finalisez votre abonnement</DialogTitle>
                      <DialogDescription>Choisissez un nom de domaine, puis vérifiez le total.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
                        <p className="font-semibold">Mode de pricing : {checkoutPlanTitle}</p>
                        <p className="mt-2 font-medium">Modules sélectionnés</p>
                        <ul className="mt-1 list-inside list-disc text-slate-600">
                          {activityModuleIds.map((id) => (
                            <li key={id}>{WELCOME_DOMAIN_LABELS[id] ?? id}</li>
                          ))}
                        </ul>
                        <p className="mt-3 flex justify-between"><span>Plan</span><strong>{planPrice.toLocaleString("fr-FR")} FCFA</strong></p>
                      </div>
                      <label className="block space-y-2 text-sm font-medium text-slate-800">
                        Nom de domaine
                        <input value={assignedDomain} onChange={(event) => setAssignedDomain(event.target.value)} placeholder="monatelier.ci" required disabled={processing} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
                      </label>
                      <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
                        10 000 FCFA/an. Si indisponible, un nom proche sera proposé automatiquement.
                      </p>
                      <label htmlFor="checkout-domain-sms-pack" className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm">
                        <input id="checkout-domain-sms-pack" type="checkbox" checked={smsPackChecked} onChange={(event) => setSmsPackChecked(event.target.checked)} className="mt-0.5 size-4 accent-orange-600" />
                        <span className="flex-1">Pack SMS illimités (MTN, Moov, Orange) + WhatsApp API — 15 000 FCFA</span>
                      </label>
                      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm">
                        <p className="flex justify-between"><span>Plan</span><strong>{planPrice.toLocaleString("fr-FR")} FCFA</strong></p>
                        <p className="flex justify-between"><span>Domaine</span><strong>{checkoutDomainPrice.toLocaleString("fr-FR")} FCFA</strong></p>
                        {smsPackChecked ? <p className="flex justify-between"><span>Pack SMS</span><strong>{PRICING_RULES.smsPackPrice.toLocaleString("fr-FR")} FCFA</strong></p> : null}
                        <p className="flex justify-between border-t border-green-200 pt-3 text-lg font-bold"><span>TOTAL</span><span>{totalAmount.toLocaleString("fr-FR")} FCFA</span></p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!assignedDomain.trim() || processing}
                        className="min-h-12 w-full bg-green-800 text-white hover:bg-green-700"
                      >
                        Continuer vers le paiement
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold text-slate-900">Récapitulatif de la facture</DialogTitle>
                      <DialogDescription>Vérifiez le forfait et la durée avant le paiement.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
                      <div className="flex justify-between gap-4">
                        <span>Plan : {checkoutPlanTitle}</span>
                        <span>{planPrice.toLocaleString("fr-FR")} FCFA/mois</span>
                      </div>
                      <div>
                        <p className="font-medium">Domaines sélectionnés</p>
                        <ul className="mt-1 list-inside list-disc text-slate-600">
                          {activityModuleIds.map((id) => <li key={id}>{WELCOME_DOMAIN_LABELS[id]}</li>)}
                        </ul>
                      </div>
                      {pricingMode ? (
                        <div className="flex justify-between gap-4 border-t pt-3">
                          <span>Nom de domaine obligatoire : {assignedDomain || "à configurer"}</span>
                          <span>{checkoutDomainPrice.toLocaleString("fr-FR")} FCFA/an</span>
                        </div>
                      ) : domainPrice > 0 ? (
                        <div className="flex justify-between gap-4 border-t pt-3">
                          <span>Domaine : {assignedDomain}</span>
                          <span>{domainPrice.toLocaleString("fr-FR")} FCFA/an</span>
                        </div>
                      ) : null}
                      {pricingMode === "modules" ? (
                        <div className="border-t pt-3 text-slate-700">
                          {repairModuleCount > 0 ? (
                            <p>Réparations ({repairModuleCount} domaines) — {repairModulePrice.toLocaleString("fr-FR")} FCFA</p>
                          ) : null}
                          {saleModuleCount > 0 ? (
                            <p>Ventes ({saleModuleCount} domaines) — {saleModulePrice.toLocaleString("fr-FR")} FCFA</p>
                          ) : null}
                        </div>
                      ) : null}
                      {isAllInOne(activityModuleIds) ? (
                        <div className="border-t pt-3 text-slate-700">
                          All-in-One (4 domaines) — {PRICING_RULES.allInOne.price.toLocaleString("fr-FR")} FCFA
                        </div>
                      ) : null}
                      {pricingMode ? (
                        <label
                          htmlFor="checkout-sms-pack"
                          className="flex cursor-pointer items-start gap-3 border-t pt-3"
                        >
                          <input
                            id="checkout-sms-pack"
                            type="checkbox"
                            checked={smsPackChecked}
                            onChange={(event) => setSmsPackChecked(event.target.checked)}
                            className="mt-0.5 size-4 accent-orange-600"
                          />
                          <span className="flex flex-1 justify-between gap-3">
                            <span>{PRICING_RULES.smsPackLabel}</span>
                            <span className="shrink-0">
                              {PRICING_RULES.smsPackPrice.toLocaleString("fr-FR")} F
                            </span>
                          </span>
                        </label>
                      ) : null}
                      {plan.id === "domain-renewal" ? (
                        <p className="border-t pt-3">Durée du domaine : 1 an</p>
                      ) : !pricingMode ? (
                        <div className="flex items-center justify-between gap-4 border-t pt-3">
                          <label htmlFor="subscription-months" className="font-medium">Durée</label>
                          <select
                            id="subscription-months"
                            value={months}
                            onChange={(event) => setMonths(Number(event.target.value) === 3 ? 3 : 1)}
                            className="h-10 rounded-lg border bg-white px-3"
                          >
                            <option value={1}>1 mois</option>
                            <option value={3}>3 mois</option>
                          </select>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-4 border-t pt-4 text-lg font-bold">
                        <span>TOTAL</span>
                        <span>{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    </div>
                    <Button type="button" onClick={() => setStep(3)} className="mt-6 min-h-12 w-full">
                      Choisir le paiement
                      <ChevronRight className="size-4" />
                    </Button>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold text-slate-900">Paiement</DialogTitle>
                      <DialogDescription>
                        Total à régler : <strong>{totalAmount.toLocaleString("fr-FR")} FCFA</strong>
                      </DialogDescription>
                    </DialogHeader>
                    <fieldset className="space-y-3" disabled={processing}>
                      <legend className="mb-3 text-sm font-semibold text-slate-800">Mode de paiement</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                          <label key={id} className="cursor-pointer">
                            <input
                              type="radio"
                              name="checkout-payment-method"
                              value={id}
                              checked={method === id}
                              onChange={() => setMethod(id)}
                              className="peer sr-only"
                            />
                            <span className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500">
                              <Icon className="size-5" />
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {method === "cash" ? (
                      <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                        Paiement en espèces à l&apos;atelier.
                      </p>
                    ) : (
                      <label className="mt-4 block space-y-2 text-sm font-medium text-slate-800">
                        Référence de transaction
                        <input
                          value={paymentReference}
                          onChange={(event) => setPaymentReference(event.target.value)}
                          required
                          placeholder="Ex. TX-123456"
                          className="h-11 w-full rounded-lg border border-slate-300 px-3"
                        />
                      </label>
                    )}
                  </>
                ) : null}
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
