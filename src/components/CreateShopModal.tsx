import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createShop } from "@/services/shopService";

interface CreateShopModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (shopId: string) => void;
}

export function CreateShopModal({ open, onClose, onSuccess }: CreateShopModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFeeAmount, setEntryFeeAmount] = useState(2000);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setAddress("");
    setPhone("");
    setEntryFeeEnabled(false);
    setEntryFeeAmount(2000);
  }, [open]);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Le nom de la boutique doit contenir au moins 2 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const shop = await createShop({
        name: trimmedName,
        address: address.trim() || null,
        phone: phone.trim() || null,
        entry_fee_enabled: entryFeeEnabled,
        entry_fee_amount: entryFeeEnabled ? entryFeeAmount : 0,
      });
      toast.success("Boutique créée.");
      onSuccess(shop.id);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la boutique.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !submitting && onClose()}>
      <DialogContent className="card-3d border-orange-100 bg-gradient-to-br from-orange-50/40 via-white to-green-50/40 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une boutique</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-shop-name">Nom de la boutique *</Label>
            <Input
              id="create-shop-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Atelier Principal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-shop-address">Adresse</Label>
            <Input
              id="create-shop-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Adresse de la boutique"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-shop-phone">Téléphone</Label>
            <Input
              id="create-shop-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Numéro de téléphone"
            />
          </div>
          <div className="space-y-4 rounded-lg border border-orange-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="create-entry-fee-enabled">Paiement à l'entrée en Atelier</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Le client paie-t-il pour l'entrée de l'appareil en réparation ?
                </p>
              </div>
              <Switch
                id="create-entry-fee-enabled"
                checked={entryFeeEnabled}
                onCheckedChange={setEntryFeeEnabled}
              />
            </div>
            {entryFeeEnabled ? (
              <div className="space-y-2">
                <Label htmlFor="create-entry-fee-amount">Montant (FCFA)</Label>
                <Input
                  id="create-entry-fee-amount"
                  type="number"
                  min={1}
                  value={entryFeeAmount}
                  onChange={(event) => setEntryFeeAmount(Math.max(1, Number(event.target.value)))}
                />
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-ivoirien bg-ivoirien-hover"
            onClick={() => void handleCreate()}
            disabled={submitting}
          >
            {submitting ? "Création…" : "Créer la boutique"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
