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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setAddress("");
    setPhone("");
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
