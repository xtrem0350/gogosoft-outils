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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateDeviceInCatalog,
  type DeviceCatalogCategory,
  type DeviceCatalogItem,
} from "@/services/deviceCatalogService";

interface EditDeviceModalProps {
  device: DeviceCatalogItem;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEVICE_CATEGORIES: Array<{ value: DeviceCatalogCategory; label: string }> = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablette" },
  { value: "laptop", label: "Ordinateur portable" },
  { value: "desktop", label: "Ordinateur de bureau" },
  { value: "other", label: "Autre" },
];

export function EditDeviceModal({ device, open, onClose, onSuccess }: EditDeviceModalProps) {
  const [brand, setBrand] = useState(device.brand);
  const [model, setModel] = useState(device.model);
  const [category, setCategory] = useState<DeviceCatalogCategory>(device.category);
  const [os, setOs] = useState(device.os ?? "");
  const [releaseYear, setReleaseYear] = useState(device.release_year?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(device.image_url ?? "");
  const [specsText, setSpecsText] = useState(JSON.stringify(device.specs, null, 2));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBrand(device.brand);
    setModel(device.model);
    setCategory(device.category);
    setOs(device.os ?? "");
    setReleaseYear(device.release_year?.toString() ?? "");
    setImageUrl(device.image_url ?? "");
    setSpecsText(JSON.stringify(device.specs, null, 2));
  }, [device, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let specs: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(specsText || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Les caractéristiques doivent être un objet JSON.");
      }
      specs = parsed as Record<string, unknown>;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "JSON des caractéristiques invalide.");
      return;
    }

    setSaving(true);
    try {
      await updateDeviceInCatalog(device.id, {
        brand: brand.trim(),
        model: model.trim(),
        category,
        os: os.trim() || null,
        release_year: releaseYear ? Number.parseInt(releaseYear, 10) : null,
        image_url: imageUrl.trim() || null,
        specs,
      });
      toast.success("Appareil mis à jour.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de modifier l'appareil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
      <DialogContent className="card-3d max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;appareil</DialogTitle>
        </DialogHeader>
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
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as DeviceCatalogCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEVICE_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Système d&apos;exploitation
            <Input value={os} onChange={(event) => setOs(event.target.value)} maxLength={100} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Année de sortie
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear() + 1}
              step={1}
              value={releaseYear}
              onChange={(event) => setReleaseYear(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            URL de l&apos;image
            <Input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Caractéristiques (JSON)
            <Textarea value={specsText} onChange={(event) => setSpecsText(event.target.value)} rows={5} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving || !brand.trim() || !model.trim()} className="bg-ivoirien bg-ivoirien-hover shadow-3d">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
