import { useEffect, useState } from "react";
import { Banknote, LoaderCircle, Smartphone, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WELCOME_PRICING } from "@/constants/pricing";
import type { ModuleId } from "@/types/modules";

type PaymentMethod = "wave" | "orange_money" | "mtn_money" | "moov_money" | "cash";

interface SubscriptionPaymentModalProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  planLabel: string;
  amountFcfa: number;
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

const MODULE_LABELS: Record<ModuleId, string> = {
  "reparation-telephone": "Réparation Téléphone",
  "reparation-pc": "Réparation PC",
  "vente-telephone": "Vente Téléphone",
  "vente-pc": "Vente PC",
  consommables: "Consommables",
  "vitrine-telephone": "Vitrine Téléphone",
  "vitrine-pc": "Vitrine PC",
  "multi-ateliers": "Multi-ateliers",
};

function readSelectedModuleLabels(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem("gogosoft.welcome.selectedModules") ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is ModuleId => typeof id === "string" && id in MODULE_LABELS)
      .map((id) => MODULE_LABELS[id]);
  } catch {
    return [];
  }
}

export function SubscriptionPaymentModal({
  open,
  onClose,
  planId,
  planLabel,
  amountFcfa,
  onSuccess,
}: SubscriptionPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("wave");
  const [processing, setProcessing] = useState(false);
  const [moduleLabels] = useState(readSelectedModuleLabels);

  useEffect(() => {
    if (!open) {
      setMethod("wave");
      setProcessing(false);
    }
  }, [open]);

  async function payNow() {
    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
    onSuccess(method, amountFcfa, true);
    setProcessing(false);
  }

  function payLater() {
    onSuccess(method, 0, false);
  }

  const MethodIcon = PAYMENT_METHODS.find((paymentMethod) => paymentMethod.id === method)?.icon ?? Waves;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !processing && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activer votre abonnement</DialogTitle>
          <DialogDescription>Choisissez votre moyen de paiement ou commencez par l&apos;essai de sept jours.</DialogDescription>
        </DialogHeader>

        <div className="card-3d space-y-3 rounded-xl border bg-muted/20 p-4 text-sm shadow-3d">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{planLabel} <span className="text-xs text-muted-foreground">({planId})</span></span>
          </div>
          <div>
            <p className="text-muted-foreground">Modules sélectionnés</p>
            <p className="mt-1 font-medium">{moduleLabels.length ? moduleLabels.join(", ") : "Aucun module"}</p>
          </div>
          <div className="flex justify-between gap-4 border-t pt-3">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-semibold">{amountFcfa.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <fieldset className="space-y-2" disabled={processing}>
          <legend className="mb-2 text-sm font-semibold">Moyen de paiement</legend>
          <div className="grid gap-2 sm:grid-cols-2">
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
                <span className="flex min-h-11 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500">
                  <Icon className="size-4 shrink-0" />
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {method === "cash" ? (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Paiement en espèces à l&apos;atelier (simulé)
          </p>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            onClick={() => void payNow()}
            disabled={processing}
            className="w-full bg-ivoirien bg-ivoirien-hover shadow-3d"
          >
            {processing ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <MethodIcon className="size-4" />
                Payer maintenant
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={payLater} disabled={processing} className="w-full">
            Payer plus tard (essai 7 jours)
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={processing} className="w-full">
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
