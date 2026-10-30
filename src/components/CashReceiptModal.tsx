// src/components/CashReceiptModal.tsx

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CashReceipt {
  reference: string;
  clientName: string;
  device: string;
  amount: number;
  date: string;
}

interface CashReceiptModalProps {
  receipt: CashReceipt | null;
  onClose: () => void;
}

function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

export function CashReceiptModal({ receipt, onClose }: CashReceiptModalProps) {
  if (!receipt) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:overflow-visible print:border-0 print:bg-white print:p-0 print:shadow-none">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .cash-receipt-print, .cash-receipt-print * { visibility: visible !important; }
            .cash-receipt-print { position: fixed; inset: 0; width: 100%; padding: 2rem; background: white; color: #111827; }
            .cash-receipt-actions { display: none !important; }
          }
        `}</style>
        <div className="cash-receipt-print space-y-6 rounded-xl bg-card p-6 text-card-foreground">
          <DialogHeader className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              GogoSoft
            </p>
            <DialogTitle className="text-xl">Reçu de paiement</DialogTitle>
          </DialogHeader>
          <dl className="space-y-3 border-y py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">N° ticket</dt>
              <dd className="text-right font-medium">{receipt.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Client</dt>
              <dd className="text-right font-medium">{receipt.clientName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Appareil</dt>
              <dd className="text-right font-medium">{receipt.device || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-right font-medium">{new Date(receipt.date).toLocaleString("fr-FR")}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3 text-base">
              <dt className="font-semibold">Montant payé</dt>
              <dd className="font-bold">{formatMoney(receipt.amount)}</dd>
            </div>
          </dl>
          <p className="text-right text-sm font-semibold">Signature : GogoSoft</p>
        </div>
        <DialogFooter className="cash-receipt-actions">
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" onClick={() => window.print()} className="bg-ivoirien bg-ivoirien-hover">
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
