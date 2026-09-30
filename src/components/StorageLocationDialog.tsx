import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createLocation,
  updateLocation,
  type StorageLocation,
  type StorageLocationType,
} from "@/services/storageService";

const LOCATION_TYPES: { value: StorageLocationType; label: string }[] = [
  { value: "carton", label: "Carton" },
  { value: "shelf", label: "Étagère" },
  { value: "drawer", label: "Tiroir" },
  { value: "bag", label: "Sachet" },
  { value: "other", label: "Autre" },
];

interface StorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  location?: StorageLocation | null;
  onSaved: (location: StorageLocation) => void;
}

export function StorageLocationDialog({
  open,
  onOpenChange,
  shopId,
  location = null,
  onSaved,
}: StorageLocationDialogProps) {
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<StorageLocationType>("carton");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(location?.name ?? "");
    setLocationType(location?.location_type ?? "carton");
    setDescription(location?.description ?? "");
  }, [location, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setSaving(true);
    try {
      const saved = location
        ? await updateLocation(location.id, {
            name: cleanName,
            location_type: locationType,
            description: description.trim() || null,
          })
        : await createLocation({
            shop_id: shopId,
            name: cleanName,
            location_type: locationType,
            ...(description.trim() ? { description: description.trim() } : {}),
          });
      if (!saved) throw new Error("Impossible d'enregistrer cet emplacement.");
      onSaved(saved);
      onOpenChange(false);
      toast.success(location ? "Emplacement modifié." : "Emplacement créé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Modifier l'emplacement" : "Créer un emplacement"}</DialogTitle>
          <DialogDescription>Organisez le rangement de votre atelier.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storage-name">Nom</Label>
            <Input
              id="storage-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="C1, Tiroir-A, Carton-1"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage-type">Type</Label>
            <Select
              value={locationType}
              onValueChange={(value) => setLocationType(value as StorageLocationType)}
            >
              <SelectTrigger id="storage-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage-description">Description (optionnel)</Label>
            <Textarea
              id="storage-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="bg-ivoirien bg-ivoirien-hover shadow-3d"
            >
              {saving ? "Enregistrement…" : location ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
