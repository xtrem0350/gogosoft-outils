import { useEffect, useState, type FormEvent } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  addDeviceToCatalog,
  type DeviceCatalogItem,
  type DeviceCatalogType,
} from "@/services/deviceCatalogService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  initialDeviceType?: DeviceCatalogType;
  onAdded: (device: DeviceCatalogItem) => void;
}

const DEVICE_TYPES: Array<{ value: DeviceCatalogType; label: string }> = [
  { value: "phone", label: "Téléphone" },
  { value: "computer", label: "Ordinateur" },
  { value: "tablet", label: "Tablette" },
  { value: "other", label: "Autre" },
];

export function AddDeviceModal({ open, onClose, initialDeviceType, onAdded }: AddDeviceModalProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceCatalogType>(initialDeviceType ?? "phone");
  const [os, setOs] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [characteristicsText, setCharacteristicsText] = useState("{}");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBrand("");
    setModel("");
    setDeviceType(initialDeviceType ?? "phone");
    setOs("");
    setImageUrl("");
    setCharacteristicsText("{}");
  }, [initialDeviceType, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let characteristics: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(characteristicsText || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Les caractéristiques doivent être un objet JSON.");
      }
      characteristics = parsed as Record<string, unknown>;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "JSON des caractéristiques invalide.");
      return;
    }

    setSaving(true);
    try {
      const device = await addDeviceToCatalog({
        brand: brand.trim(),
        model: model.trim(),
        device_type: deviceType,
        os: os.trim() || null,
        image_url: imageUrl.trim() || null,
        characteristics,
      });
      toast.success("Appareil ajouté au catalogue.");
      onAdded(device);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter l'appareil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Ajouter un appareil</DialogTitle></DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Marque
              <Input value={brand} onChange={(event) => setBrand(event.target.value)} required maxLength={80} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Modèle
              <Input value={model} onChange={(event) => setModel(event.target.value)} required maxLength={120} />
            </label>
          </div>
          <div className="grid gap-2 text-sm font-medium">
            <Label>Type d&apos;appareil</Label>
            <Select value={deviceType} onValueChange={(value) => setDeviceType(value as DeviceCatalogType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Système d&apos;exploitation
            <Input value={os} onChange={(event) => setOs(event.target.value)} maxLength={100} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            URL de l&apos;image (optionnel)
            <Input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Caractéristiques JSON (optionnel)
            <Textarea value={characteristicsText} onChange={(event) => setCharacteristicsText(event.target.value)} rows={4} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving || !brand.trim() || !model.trim()} className="bg-ivoirien bg-ivoirien-hover shadow-3d">
              {saving ? "Ajout…" : "Ajouter l'appareil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
