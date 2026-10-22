import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ConsumedPart {
  name: string;
  qty: number;
  unit_price?: number;
}

interface AddPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (part: ConsumedPart) => void;
}

export function AddPartDialog({ open, onOpenChange, onAdd }: AddPartDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setQuantity("1");
    setUnitPrice("");
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = Number(quantity);
    const price = unitPrice.trim() ? Number(unitPrice) : undefined;
    if (!name.trim() || !Number.isInteger(qty) || qty < 1) return;
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) return;
    onAdd({
      name: name.trim(),
      qty,
      ...(price !== undefined ? { unit_price: price } : {}),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une pièce consommée</DialogTitle>
          <DialogDescription>
            Saisissez la pièce utilisée. Elle sera enregistrée dans la fiche de réparation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consumed-part-name">Nom de la pièce</Label>
            <Input
              id="consumed-part-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consumed-part-quantity">Quantité</Label>
              <Input
                id="consumed-part-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumed-part-price">Prix unitaire (FCFA, optionnel)</Label>
              <Input
                id="consumed-part-price"
                type="number"
                min="0"
                step="1"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d">
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
