import { useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { searchDevices, type ActivityType, type KnownDevice } from "@/services/workshopService";
import { useAsyncList } from "./useAsyncOptions";

interface Props {
  shopId: string | null;
  clientId?: string;
  activityType?: ActivityType;
  onSelect: (device: KnownDevice) => void;
}

/** Sélection d'un appareil déjà passé à l'atelier. */
export function DeviceSelect({ shopId, clientId, activityType = "phone", onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const { items, loading } = useAsyncList(
    shopId ? `${shopId}:${clientId ?? "all"}:${activityType}` : null,
    () => searchDevices(shopId, "", activityType, clientId),
  );
  const keyOf = (d: KnownDevice, i: number) =>
    d.device_imei || d.device_sn || `${d.device_model}-${i}`;
  return (
    <SearchableSelect
      options={items.map((d, i) => ({
        value: keyOf(d, i),
        label: d.device_model,
        description: `IMEI: ${d.device_imei ?? "—"}`,
      }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un appareil déjà connu"
      searchPlaceholder="Modèle, IMEI ou SN..."
      emptyMessage="Nouvel appareil. Remplissez les champs ci-dessous."
      onSelect={(option) => {
        const device = items.find((d, i) => keyOf(d, i) === option.value);
        if (!device) return;
        setValue(option.value);
        onSelect(device);
      }}
    />
  );
}
