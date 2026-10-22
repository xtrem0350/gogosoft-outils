import { useCallback, useEffect, useState } from "react";
import { Image, Laptop, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AddDeviceModal } from "@/components/AddDeviceModal";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import {
  getDeviceCatalog,
  type DeviceCatalogCategory,
  type DeviceCatalogItem,
  type DeviceCatalogType,
} from "@/services/deviceCatalogService";

export type DeviceCategory = "smartphone" | "laptop";
const PHONE_CATALOG_CATEGORIES: DeviceCatalogCategory[] = ["smartphone", "tablet"];
const COMPUTER_CATALOG_CATEGORIES: DeviceCatalogCategory[] = ["laptop", "desktop"];

export interface CatalogDevice {
  brand: string;
  model: string;
  processor: string | null;
  os?: string | null;
  imageUrl: string | null;
}

interface DeviceCatalogPickerProps {
  shopId: string | null;
  category: DeviceCategory;
  onSelect: (device: CatalogDevice) => void;
  onFreeEntry: () => void;
}

export function DeviceCatalogPicker({
  shopId: _shopId,
  category,
  onSelect,
  onFreeEntry,
}: DeviceCatalogPickerProps) {
  const deviceType: DeviceCatalogType = category === "laptop" ? "computer" : "phone";
  const allowedCategories =
    category === "laptop" ? COMPUTER_CATALOG_CATEGORIES : PHONE_CATALOG_CATEGORIES;
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await getDeviceCatalog(deviceType));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalogue indisponible.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [deviceType]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectDevice(device: DeviceCatalogItem) {
    const processor = device.characteristics["processor"];
    onSelect({
      brand: device.brand,
      model: device.model,
      processor: typeof processor === "string" ? processor : null,
      os: device.os,
      imageUrl: device.image_url,
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
        <Plus className="size-4" /> Ajouter un appareil
      </Button>
      <SearchableSelect
        options={devices.map((device) => ({
          value: device.id,
          label: `${device.brand} ${device.model}`,
          description: device.os ?? undefined,
          icon: device.image_url ? <img src={device.image_url} alt="" className="size-9 shrink-0 rounded-full object-cover" /> : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
              {device.brand.slice(0, 1).toUpperCase()}
            </span>
          ),
        }))}
        loading={loading}
        placeholder={`Choisir un modèle ${category === "smartphone" ? "de téléphone" : "d'ordinateur"}`}
        searchPlaceholder="Marque ou modèle…"
        emptyMessage="Aucun appareil dans le catalogue."
        onSelect={(option) => {
          const device = devices.find((item) => item.id === option.value);
          if (device) selectDevice(device);
        }}
      />
      {devices.length ? (
        <div className="flex flex-wrap gap-2">
          {devices.slice(0, 6).map((device) => device.image_url ? (
            <img
              key={device.id}
              src={device.image_url}
              alt={`${device.brand} ${device.model}`}
              title={`${device.brand} ${device.model}${device.os ? ` · ${device.os}` : ""}`}
              className="size-12 rounded-full border object-cover"
              loading="lazy"
            />
          ) : null)}
          {!devices.some((device) => device.image_url) ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              {category === "laptop" ? <Laptop className="size-4" /> : <Smartphone className="size-4" />}
              <Image className="size-4" aria-hidden="true" />
              Les modèles sans image restent sélectionnables.
            </span>
          ) : null}
        </div>
      ) : null}
      <Button type="button" variant="link" className="h-auto p-0" onClick={onFreeEntry}>
        Utiliser la saisie libre
      </Button>
      <AddDeviceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initialDeviceType={deviceType}
        allowedCategories={allowedCategories}
        defaultCategory={category === "laptop" ? "laptop" : "smartphone"}
        onAdded={(device) => {
          setDevices((current) => [device, ...current]);
          selectDevice(device);
        }}
      />
    </div>
  );
}
