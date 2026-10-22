import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const paymentMethods = ["Espèces", "Wave", "Orange Money", "MTN", "Moov"] as const;

interface WorkshopPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  onSuccess: (method: string, amount: number) => void;
}

export function WorkshopPaymentModal({
  open,
  onClose,
  amount,
  title,
  onSuccess,
}: WorkshopPaymentModalProps) {
  const [method, setMethod] = useState<string>(paymentMethods[0]);

  useEffect(() => {
    if (open) setMethod(paymentMethods[0]);
  }, [open]);

  const formattedAmount = `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="card-3d max-w-md border-orange-100 shadow-3d">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Choisissez le mode de paiement utilisé.</DialogDescription>
        </DialogHeader>
        <p className="rounded-xl bg-gradient-to-r from-orange-50 via-white to-green-50 py-5 text-center text-3xl font-bold text-slate-900">
          {formattedAmount}
        </p>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-2 text-sm font-medium">Mode de paiement</legend>
          {paymentMethods.map((paymentMethod) => (
            <label
              key={paymentMethod}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${
                method === paymentMethod
                  ? "border-orange-500 bg-orange-50 text-orange-900"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="workshop-payment-method"
                value={paymentMethod}
                checked={method === paymentMethod}
                onChange={() => setMethod(paymentMethod)}
                className="accent-orange-600"
              />
              {paymentMethod}
            </label>
          ))}
        </fieldset>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-ivoirien bg-ivoirien-hover shadow-3d"
            onClick={() => {
              onSuccess(method, amount);
              onClose();
            }}
          >
            Valider l'encaissement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
