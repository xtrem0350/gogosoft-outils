import { useEffect, useState } from "react";
import { Banknote, Check, ChevronLeft, ChevronRight, LoaderCircle, Smartphone, Waves } from "lucide-react";
import { toast } from "sonner";

import authLogo from "@/assets/images/leprofile.png";
import { BONUS_DAYS, DOMAIN_PRICE, type PricingPlan } from "@/constants/pricing";
import { WELCOME_DOMAIN_LABELS, type WelcomeDomainId } from "@/constants/welcomeDomains";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkDomainAvailability,
  findClosestAvailableDomain,
  type DomainChoice,
} from "@/services/domainService";
import type { SubscriptionPaymentInvoice } from "@/services/subscriptionPaymentService";

type PaymentMethod = "wave" | "orange_money" | "mtn_money" | "moov_money" | "cash";
type CheckoutStep = 1 | 2 | 3;

export interface CheckoutSubmission {
  domainName: string;
  choices: DomainChoice;
  subscriptionMonths: 1 | 3;
  paymentMethod: PaymentMethod;
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
  onPay: (submission: CheckoutSubmission) => Promise<SubscriptionPaymentInvoice>;
  onComplete: () => void;
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  icon: typeof Waves;
}> = [
  { id: "wave", label: "Wave", icon: Waves },
  { id: "orange_money", label: "Orange Money", icon: Smartphone },
  { id: "mtn_money", label: "MTN Money", icon: Smartphone },
  { id: "moov_money", label: "Moov Money", icon: Smartphone },
  { id: "cash", label: "Espèces", icon: Banknote },
];

const EMPTY_CHOICES: DomainChoice = { choice_1: "", choice_2: "", choice_3: "" };

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
  onPay,
  onComplete,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>(domainRequired ? 1 : 2);
  const [choices, setChoices] = useState<DomainChoice>(EMPTY_CHOICES);
  const [assignedDomain, setAssignedDomain] = useState(initialDomain);
  const [months, setMonths] = useState<1 | 3>(initialMonths);
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<SubscriptionPaymentInvoice | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(domainRequired ? 1 : 2);
    setChoices(EMPTY_CHOICES);
    setAssignedDomain(initialDomain);
    setMonths(initialMonths);
    setMethod("wave");
    setChecking(false);
    setProcessing(false);
    setInvoice(null);
  }, [domainRequired, initialDomain, initialMonths, open]);

  const totalAmount = plan.price * months + domainPrice;
  const selectedMethod = PAYMENT_METHODS.find((item) => item.id === method) ?? PAYMENT_METHODS[0]!;

  function updateChoice(key: keyof DomainChoice, value: string) {
    setChoices((current) => ({ ...current, [key]: value.trim().toLowerCase() }));
    setAssignedDomain("");
  }

  async function checkAvailability() {
    setChecking(true);
    try {
      const submittedChoices = [choices.choice_1, choices.choice_2, choices.choice_3].filter(Boolean);
      if (!choices.choice_1) throw new Error("Saisissez votre premier nom de domaine.");
      for (const choice of submittedChoices) {
        if (!/^[a-z0-9-]+\.ci$/.test(choice)) {
          throw new Error("Chaque domaine doit respecter le format nom.ci.");
        }
      }
      let finalName = "";
      for (const choice of submittedChoices) {
        if (await checkDomainAvailability(choice)) {
          finalName = choice;
          break;
        }
      }
      if (!finalName) finalName = await findClosestAvailableDomain(submittedChoices);
      setAssignedDomain(finalName);
      toast.success(`Domaine disponible : ${finalName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification du domaine impossible.");
    } finally {
      setChecking(false);
    }
  }

  async function submitPayment() {
    if (domainRequired && (!assignedDomain || !choices.choice_1)) {
      toast.error("Vérifiez la disponibilité du domaine avant de continuer.");
      setStep(1);
      return;
    }
    setProcessing(true);
    try {
      const createdInvoice = await onPay({
        domainName: assignedDomain,
        choices,
        subscriptionMonths: months,
        paymentMethod: method,
        domainPrice,
      });
      setInvoice(createdInvoice);
      toast.success(`Paiement confirmé ! Facture ${createdInvoice.invoice_number}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le paiement n'a pas pu être confirmé.");
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
      <DialogContent className="h-[min(92vh,860px)] max-h-[92vh] max-w-6xl overflow-hidden border-0 bg-transparent p-0 shadow-2xl [&>button]:z-20 [&>button]:text-slate-700">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .invoice-print, .invoice-print * { visibility: visible !important; }
            .invoice-print { position: fixed; inset: 0; overflow: visible; padding: 24px; background: white; }
          }
        `}</style>
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.78fr_1.22fr] lg:grid-rows-1">
          <aside className="flex min-h-0 flex-col justify-between gap-5 overflow-y-auto bg-slate-900 p-5 text-white sm:p-7 lg:p-9">
            <div>
              <img src={authLogo} alt="GogoSoft" className="mb-5 size-16 rounded-full border-2 border-white/20 object-cover" />
              <p className="text-sm font-medium text-blue-300">Paiement sécurisé</p>
              <h2 className="mt-2 text-3xl font-bold">Finalisez votre abonnement</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Votre espace et vos domaines seront activés après confirmation du paiement.
              </p>
            </div>

            {invoice ? (
              <div className="space-y-3">
                <Button type="button" onClick={printInvoice} className="min-h-12 w-full bg-ivoirien bg-ivoirien-hover">
                  Télécharger PDF / Imprimer
                </Button>
                <Button type="button" variant="outline" onClick={onComplete} className="min-h-12 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  Continuer
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Étape {step} sur 3</p>
                {step === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={onClose}
                    disabled={checking || processing}
                  >
                    Annuler
                  </Button>
                ) : null}
                {step === 2 && domainRequired ? (
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="min-h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <ChevronLeft className="size-4" />
                    Modifier les domaines
                  </Button>
                ) : null}
                {step === 3 ? (
                  <div className="space-y-3">
                    <Button type="button" onClick={() => void submitPayment()} disabled={processing} className="min-h-12 w-full bg-ivoirien bg-ivoirien-hover shadow-3d">
                      {processing ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <selectedMethod.icon className="size-4" />
                          Payer {totalAmount.toLocaleString("fr-FR")} FCFA
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={processing} className="min-h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                      <ChevronLeft className="size-4" />
                      Retour au récapitulatif
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
            <p className="text-xs text-slate-400">© 2026 GogoSoft · Solution ivoirienne</p>
          </aside>

          <section className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7 lg:p-9">
            {invoice ? (
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
                      <dt>Plan : {plan.title}</dt>
                      <dd>{invoice.plan_price.toLocaleString("fr-FR")} FCFA × {invoice.subscription_months}</dd>
                    </div>
                    <div className="border-t pt-3">
                      <dt className="font-medium">Domaines</dt>
                      <dd className="mt-1 text-slate-600">
                        {selectedDomainIds.map((id) => WELCOME_DOMAIN_LABELS[id]).join(", ") || invoice.modules.join(", ")}
                      </dd>
                    </div>
                    {invoice.domain_name ? (
                      <div className="flex justify-between gap-4 border-t pt-3">
                        <dt>Domaine : {invoice.domain_name}</dt>
                        <dd>{invoice.domain_price.toLocaleString("fr-FR")} FCFA</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <dt>Durée</dt>
                      <dd>
                        {invoice.plan_id === "domain-renewal"
                          ? "1 an"
                          : `${invoice.subscription_months} mois + ${invoice.bonus_days} jours`}
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
                <Button type="button" variant="outline" onClick={printInvoice} className="print:hidden">
                  Télécharger PDF / Imprimer
                </Button>
              </div>
            ) : (
              <>
                {step === 1 ? (
                  <>
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold text-slate-900">Choisissez votre domaine</DialogTitle>
                      <DialogDescription>Un domaine .ci est obligatoire. Proposez jusqu&apos;à trois noms.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {([
                        ["choice_1", "Domaine souhaité 1 (obligatoire)", true],
                        ["choice_2", "Domaine souhaité 2 (optionnel)", false],
                        ["choice_3", "Domaine souhaité 3 (optionnel)", false],
                      ] as const).map(([key, label, required]) => (
                        <label key={key} className="block space-y-2 text-sm font-medium text-slate-800">
                          {label}
                          <input
                            value={choices[key]}
                            onChange={(event) => updateChoice(key, event.target.value)}
                            placeholder="monatelier.ci"
                            required={required}
                            pattern="[a-z0-9-]+\\.ci"
                            disabled={checking || processing}
                            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          />
                        </label>
                      ))}
                      <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
                        Nom de domaine .ci obligatoire — {DOMAIN_PRICE.toLocaleString("fr-FR")} FCFA/an
                      </p>
                      {assignedDomain ? (
                        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
                          Domaine attribué : {assignedDomain}
                        </p>
                      ) : null}
                      <Button type="button" onClick={() => void checkAvailability()} disabled={checking || processing} className="min-h-12 w-full">
                        {checking ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Vérifier la disponibilité
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!assignedDomain || checking || processing}
                        className="min-h-12 w-full bg-ivoirien bg-ivoirien-hover"
                      >
                        Continuer
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
                        <span>Plan : {plan.title}</span>
                        <span>{plan.price.toLocaleString("fr-FR")} FCFA/mois</span>
                      </div>
                      <div>
                        <p className="font-medium">Domaines sélectionnés</p>
                        <ul className="mt-1 list-inside list-disc text-slate-600">
                          {selectedDomainIds.map((id) => <li key={id}>{WELCOME_DOMAIN_LABELS[id]}</li>)}
                        </ul>
                      </div>
                      {domainPrice > 0 ? (
                        <div className="flex justify-between gap-4 border-t pt-3">
                          <span>Domaine : {assignedDomain}</span>
                          <span>{domainPrice.toLocaleString("fr-FR")} FCFA/an</span>
                        </div>
                      ) : null}
                      {plan.id === "domain-renewal" ? (
                        <p className="border-t pt-3">Durée du domaine : 1 an</p>
                      ) : (
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
                      )}
                      {plan.id !== "domain-renewal" ? (
                        <p className="border-t pt-3">Bonus : +{BONUS_DAYS} jours offerts</p>
                      ) : null}
                      <div className="flex justify-between gap-4 border-t pt-4 text-lg font-bold">
                        <span>TOTAL</span>
                        <span>{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    </div>
                    <Button type="button" onClick={() => setStep(3)} className="mt-6 min-h-12 w-full bg-ivoirien bg-ivoirien-hover">
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
                    ) : null}
                    {plan.id !== "domain-renewal" ? (
                      <p className="mt-5 text-sm text-slate-600">
                        Bonus inclus : {BONUS_DAYS} jours d&apos;abonnement offerts après le paiement.
                      </p>
                    ) : null}
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
