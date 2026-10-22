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
import {
  addDeviceToCatalog,
  type DeviceCatalogCategory,
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
  onSuccess?: () => void;
  defaultCategory?: DeviceCatalogCategory;
  allowedCategories?: DeviceCatalogCategory[];
  initialDeviceType?: DeviceCatalogType;
  onAdded?: (device: DeviceCatalogItem) => void;
}

const DEVICE_CATEGORIES: Array<{ value: DeviceCatalogCategory; label: string }> = [
  { value: "smartphone", label: "Téléphone" },
  { value: "tablet", label: "Tablette" },
  { value: "laptop", label: "Ordinateur portable" },
  { value: "desktop", label: "Ordinateur de bureau" },
  { value: "other", label: "Autre" },
];
const ALL_DEVICE_CATEGORIES = DEVICE_CATEGORIES.map(({ value }) => value);

function categoryFromLegacyType(type?: DeviceCatalogType): DeviceCatalogCategory | undefined {
  if (type === "phone") return "smartphone";
  if (type === "computer") return "laptop";
  if (type === "tablet" || type === "other") return type;
  return undefined;
}

export function AddDeviceModal({
  open,
  onClose,
  onSuccess,
  defaultCategory,
  allowedCategories,
  initialDeviceType,
  onAdded,
}: AddDeviceModalProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const effectiveDefaultCategory = defaultCategory ?? categoryFromLegacyType(initialDeviceType);
  const categories = allowedCategories ?? ALL_DEVICE_CATEGORIES;
  const [category, setCategory] = useState<DeviceCatalogCategory>(
    effectiveDefaultCategory ?? categories[0] ?? "smartphone",
  );
  const [os, setOs] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBrand("");
    setModel("");
    setCategory(
      categories.length === 1
        ? categories[0]!
        : effectiveDefaultCategory && categories.includes(effectiveDefaultCategory)
          ? effectiveDefaultCategory
          : categories[0] ?? "smartphone",
    );
    setOs("");
    setReleaseYear("");
    setImageUrl("");
  }, [categories, effectiveDefaultCategory, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const device = await addDeviceToCatalog({
        brand: brand.trim(),
        model: model.trim(),
        category: categories.length === 1 ? categories[0]! : category,
        os: os.trim() || null,
        release_year: releaseYear ? Number.parseInt(releaseYear, 10) : null,
        image_url: imageUrl.trim() || null,
        specs: {},
        popularity_ci: 5,
      });
      toast.success("Appareil ajouté au catalogue.");
      onSuccess?.();
      onAdded?.(device);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter l'appareil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
      <DialogContent className="card-3d max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Ajouter un appareil au catalogue</DialogTitle></DialogHeader>
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
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as DeviceCatalogCategory)}
              disabled={categories.length === 1}
            >
              <SelectTrigger disabled={categories.length === 1}><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEVICE_CATEGORIES.filter(({ value }) => categories.includes(value)).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Système d&apos;exploitation
            <Input value={os} onChange={(event) => setOs(event.target.value)} maxLength={100} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Année de sortie (optionnel)
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear() + 1}
              step={1}
              value={releaseYear}
              onChange={(event) => setReleaseYear(event.target.value)}
              placeholder="2024"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            URL de l&apos;image (optionnel)
            <Input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
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
