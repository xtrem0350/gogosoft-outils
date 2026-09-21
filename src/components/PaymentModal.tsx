import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, plan, amount, onSuccess }: PaymentModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      setIsProcessing(false);
      return;
    }

    setCountdown(3);
    setIsProcessing(false);
  }, [open]);

  async function handlePay() {
    setIsProcessing(true);

    let remaining = 3;
    const interval = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 200);
      }
    }, 1000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement du plan {plan}</DialogTitle>
          <DialogDescription>Confirmez le paiement pour activer votre abonnement.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold capitalize">{plan}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-semibold">{amount.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handlePay()} disabled={isProcessing} className="min-w-[180px]">
            {isProcessing ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Paiement {countdown}s
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Payer avec Wave
              </>
            )}
          </Button>
        </DialogFooter>

        {isProcessing ? (
          <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Paiement accepté en attente de confirmation...
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
