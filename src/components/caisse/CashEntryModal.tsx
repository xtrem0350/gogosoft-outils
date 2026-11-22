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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReadOnlyGuard, useSubscriptionAccess } from "@/components/SubscriptionGuard";
import { createCashEntry } from "@/services/cashService";

interface CashEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string | null;
  sessionOpen: boolean;
}

type CashMethod = "cash" | "wave" | "orange_money" | "mtn" | "moov";

export function CashEntryModal({ open, onClose, onSuccess, shopId, sessionOpen }: CashEntryModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<CashMethod>("cash");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { isReadOnly } = useSubscriptionAccess();

  async function handleSubmit(): Promise<void> {
    if (isReadOnly) {
      toast.error("Votre abonnement a expiré. Cette action est désactivée.");
      return;
    }
    const numericAmount = Number(amount);
    if (!shopId) {
      toast.error("Aucune boutique active.");
      return;
    }
    if (!sessionOpen) {
      toast.error("Ouvrez une session de caisse pour effectuer des opérations.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Saisissez un montant supérieur à zéro.");
      return;
    }
    setSaving(true);
    try {
      const trimmed = description.trim();
      await createCashEntry(shopId, {
        amount: numericAmount,
        method,
        ...(trimmed ? { description: trimmed } : {}),
      });
      toast.success("Entrée de caisse enregistrée.");
      setAmount("");
      setMethod("cash");
      setDescription("");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer l'entrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter une entrée</DialogTitle></DialogHeader>
        {!sessionOpen ? (
          <p role="status" className="text-sm text-muted-foreground">
            Ouvrez une session de caisse pour effectuer des opérations.
          </p>
        ) : null}
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Montant
            <Input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Méthode
            <select value={method} onChange={(event) => setMethod(event.target.value as CashMethod)} className="h-10 rounded-md border border-input bg-background px-3">
              <option value="cash">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn">MTN Money</option>
              <option value="moov">Moov Money</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <ReadOnlyGuard><Button type="button" onClick={() => void handleSubmit()} disabled={saving || !sessionOpen}>{saving ? "Enregistrement…" : "Enregistrer l'entrée"}</Button></ReadOnlyGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}