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
import { supabase } from "@/integrations/supabase/client";

interface CashEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string | null;
}

type CashMethod = "cash" | "wave" | "orange_money" | "mtn" | "moov";

export function CashEntryModal({ open, onClose, onSuccess, shopId }: CashEntryModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<CashMethod>("cash");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(): Promise<void> {
    const numericAmount = Number(amount);
    if (!shopId) {
      toast.error("Aucune boutique active.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Saisissez un montant supérieur à zéro.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("create_cash_entry" as never, {
        p_shop_id: shopId,
        p_amount: numericAmount,
        p_method: method,
        p_description: description.trim() || null,
      } as never);
      if (error) throw new Error(error.message);
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
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l'entrée"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
