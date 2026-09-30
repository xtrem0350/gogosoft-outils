import { useEffect } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { getAvailableLocations, type StorageLocation } from "@/services/storageService";
import { useAsyncList } from "./useAsyncOptions";

interface StorageLocationSelectProps {
  shopId: string | null;
  value?: string | undefined;
  onSelect: (location: StorageLocation) => void;
}

export function StorageLocationSelect({ shopId, value, onSelect }: StorageLocationSelectProps) {
  const { items, loading } = useAsyncList(shopId, () => getAvailableLocations(shopId ?? ""));

  useEffect(() => {
    if (!value && items[0]) onSelect(items[0]);
  }, [items, onSelect, value]);

  return (
    <SearchableSelect
      options={items.map((location) => ({
        value: location.id,
        label: location.name,
        description: location.description ?? location.location_type,
      }))}
      value={value}
      loading={loading}
      placeholder="Choisir un emplacement libre"
      searchPlaceholder="Nom de l'emplacement..."
      emptyMessage="Aucun emplacement libre."
      onSelect={(option) => {
        const location = items.find((item) => item.id === option.value);
        if (location) onSelect(location);
      }}
    />
  );
}
