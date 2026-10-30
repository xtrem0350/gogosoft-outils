// src/components/CashClosureModal.tsx

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { closeCashPeriod, type CashPeriod, type CashSummary } from "@/services/cashService";

interface CashClosureModalProps {
  open: boolean;
  onClose: () => void;
  summary: CashSummary;
  period: CashPeriod;
  exitsTotal?: number;
  onSuccess: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN Money",
  moov: "Moov Money",
};

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

export function CashClosureModal({
  open,
  onClose,
  summary,
  period,
  exitsTotal = 0,
  onSuccess,
}: CashClosureModalProps) {
  const { shopId } = useCurrentShop();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function confirmClosure() {
    if (!shopId) {
      toast.error("Aucune boutique active.");
      return;
    }
    setSaving(true);
    try {
      await closeCashPeriod(shopId, period, notes, exitsTotal);
      toast.success("Clôture de caisse enregistrée.");
      setNotes("");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de clôturer la caisse.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clôturer la caisse</DialogTitle>
        </DialogHeader>
        <div className="card-3d space-y-4 rounded-xl border bg-muted/20 p-4 shadow-3d">
          <p className="text-sm text-muted-foreground">
            {period.start.toLocaleString("fr-FR")} – {period.end.toLocaleString("fr-FR")}
          </p>
          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <span>Entrées</span>
              <span className="font-semibold">{formatMoney(summary.totalGeneral)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Sorties</span>
              <span className="font-semibold">{formatMoney(exitsTotal)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3 text-base">
              <span className="font-bold">Solde</span>
              <span className="font-bold">{formatMoney(summary.totalGeneral - exitsTotal)}</span>
            </div>
          </div>
          <div className="space-y-2 border-t pt-3 text-sm">
            {Object.entries(summary.breakdown).map(([method, amount]) => (
              <div key={method} className="flex justify-between gap-4">
                <span>{PAYMENT_LABELS[method] ?? method}</span>
                <span className="font-semibold">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Notes (optionnel)
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void confirmClosure()}
            disabled={saving}
            className="bg-ivoirien bg-ivoirien-hover shadow-3d"
          >
            {saving ? "Clôture…" : "Confirmer la clôture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
