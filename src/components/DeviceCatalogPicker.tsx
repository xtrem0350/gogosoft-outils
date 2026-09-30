import { Image, Smartphone } from "lucide-react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import { useAsyncList } from "@/components/selects/useAsyncOptions";
import { getMyGuides } from "@/services/guideService";
import type { RepairGuide } from "@/services/guideService";

export type DeviceCategory = "smartphone" | "laptop";

export interface CatalogDevice {
  brand: string;
  model: string;
  processor: string | null;
  imageUrl: string | null;
}

interface DeviceCatalogPickerProps {
  shopId: string | null;
  category: DeviceCategory;
  onSelect: (device: CatalogDevice) => void;
  onFreeEntry: () => void;
}

const PHONE_MODEL =
  /iphone|galaxy|redmi|pixel|nokia|tecno|itel|infinix|oppo|vivo|huawei|honor|smartphone/i;
const LAPTOP_MODEL =
  /laptop|notebook|macbook|thinkpad|thinkbook|ideapad|pavilion|probook|elitebook|inspiron|latitude|vivobook|zenbook|aspire|swift|chromebook/i;

function matchesCategory(guide: RepairGuide, category: DeviceCategory): boolean {
  const model = `${guide.brand} ${guide.device_model}`;
  return (category === "smartphone" ? PHONE_MODEL : LAPTOP_MODEL).test(model);
}

export function DeviceCatalogPicker({
  shopId,
  category,
  onSelect,
  onFreeEntry,
}: DeviceCatalogPickerProps) {
  const { items, loading } = useAsyncList(shopId, () => getMyGuides(shopId));
  const devices = items.filter((guide) => matchesCategory(guide, category));

  return (
    <div className="space-y-2">
      <SearchableSelect
        options={devices.map((device) => ({
          value: device.id,
          label: `${device.brand} ${device.device_model}`,
          description: device.processor ?? undefined,
          icon: device.images?.[0] ? (
            <img
              src={device.images[0]}
              alt=""
              className="size-9 shrink-0 rounded-md object-cover"
            />
          ) : (
            <Smartphone className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          ),
        }))}
        loading={loading}
        placeholder={`Choisir un modèle ${category === "smartphone" ? "de téléphone" : "d'ordinateur"}`}
        searchPlaceholder="Marque ou modèle..."
        emptyMessage="Aucun modèle enregistré dans les fiches d'expérience."
        onSelect={(option) => {
          const guide = devices.find((item) => item.id === option.value);
          if (!guide) return;
          onSelect({
            brand: guide.brand,
            model: guide.device_model,
            processor: guide.processor,
            imageUrl: guide.images?.[0] ?? null,
          });
        }}
      />
      {devices.length ? (
        <div className="flex flex-wrap gap-2">
          {devices
            .slice(0, 6)
            .map((device) =>
              device.images?.[0] ? (
                <img
                  key={device.id}
                  src={device.images[0]}
                  alt={`${device.brand} ${device.device_model}`}
                  title={`${device.brand} ${device.device_model}`}
                  className="size-12 rounded-md border object-cover"
                  loading="lazy"
                />
              ) : null,
            )}
          {!devices.some((device) => device.images?.[0]) ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Image className="size-4" aria-hidden="true" />
              Photos affichées quand une fiche d'expérience en contient.
            </span>
          ) : null}
        </div>
      ) : null}
      <Button type="button" variant="link" className="h-auto p-0" onClick={onFreeEntry}>
        Utiliser la saisie libre
      </Button>
    </div>
  );
}
