import { useEffect, useState } from "react";
import { Banknote, Check, LoaderCircle, Smartphone, Waves } from "lucide-react";

import authLogo from "@/assets/images/leprofile.png";
import { Button } from "@/components/ui/button";
import {
  WELCOME_DOMAIN_LABELS,
  type WelcomeDomainId,
} from "@/constants/welcomeDomains";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PricingPlan } from "@/constants/pricing";

type PaymentMethod = "wave" | "orange_money" | "mtn_money" | "moov_money" | "cash";

interface SubscriptionPaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: PricingPlan;
  selectedDomainIds: WelcomeDomainId[];
  onSuccess: (method: string, amount: number, paid: boolean) => void;
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
  { id: "cash", label: "Espèces (simulé)", icon: Banknote },
];

export function SubscriptionPaymentModal({
  open,
  onClose,
  plan,
  selectedDomainIds,
  onSuccess,
}: SubscriptionPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setMethod("wave");
      setProcessing(false);
    }
  }, [open]);

  async function payNow() {
    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
    onSuccess(method, plan.price, true);
    setProcessing(false);
  }

  function payLater() {
    onSuccess(method, 0, false);
  }

  const MethodIcon = PAYMENT_METHODS.find((paymentMethod) => paymentMethod.id === method)?.icon ?? Waves;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !processing && onClose()}>
      <DialogContent className="h-[min(90vh,820px)] max-h-[90vh] max-w-5xl overflow-hidden border-0 bg-transparent p-0 shadow-2xl [&>button]:text-slate-700">
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.8fr_1.2fr] lg:grid-rows-1">
          <section className="flex min-h-0 flex-col justify-between gap-6 overflow-y-auto bg-slate-900 p-5 text-white sm:p-8 lg:p-10">
            <div>
              <img
                src={authLogo}
                alt="GogoSoft"
                className="mb-6 size-20 rounded-full border-2 border-white/20 object-cover"
              />
              <p className="text-sm font-medium text-blue-300">Bienvenue sur GogoSoft</p>
              <h2 className="mt-2 text-3xl font-bold">Activez votre espace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Vérifiez vos domaines et votre offre, puis choisissez comment régler votre abonnement.
              </p>
            </div>

            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <Button
                type="button"
                onClick={() => void payNow()}
                disabled={processing}
                className="min-h-12 w-full bg-ivoirien bg-ivoirien-hover shadow-3d"
              >
                {processing ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <MethodIcon className="size-4" />
                    Payer {plan.price.toLocaleString("fr-FR")} FCFA
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={payLater}
                disabled={processing}
                className="min-h-12 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Commencer l&apos;essai gratuit de 7 jours
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} disabled={processing} className="w-full text-slate-300 hover:bg-white/10 hover:text-white">
                Annuler
              </Button>
            </DialogFooter>
            <p className="text-xs text-slate-400">© 2026 GogoSoft · Solution ivoirienne</p>
          </section>

          <section className="min-h-0 overflow-y-auto bg-white p-5 sm:p-7 lg:p-10">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-slate-900">Récapitulatif et paiement</DialogTitle>
              <DialogDescription>
                Vérifiez votre sélection puis choisissez votre moyen de paiement.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Domaines sélectionnés
                </p>
                {selectedDomainIds.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedDomainIds.map((id) => (
                      <li key={id} className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <Check className="size-4 shrink-0 text-green-600" />
                        {WELCOME_DOMAIN_LABELS[id]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Aucun domaine sélectionné</p>
                )}
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offre choisie</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{plan.title}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.subtitle}</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {plan.price.toLocaleString("fr-FR")} FCFA
                  <span className="ml-1 text-xs font-normal text-slate-500">/mois</span>
                </p>
              </div>
            </div>

            <fieldset className="space-y-3" disabled={processing}>
              <legend className="mb-3 text-sm font-semibold text-slate-800">Choisissez un mode de paiement</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <label key={id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="subscription-payment-method"
                      value={id}
                      checked={method === id}
                      onChange={() => setMethod(id)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-900 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500">
                      <Icon className="size-5 shrink-0" />
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {method === "cash" ? (
              <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                Paiement en espèces à l&apos;atelier (simulé)
              </p>
            ) : null}

          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
