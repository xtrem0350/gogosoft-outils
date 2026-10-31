import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { getAvailableLocations, type StorageLocation } from "@/services/storageService";
import { useAsyncList } from "./useAsyncOptions";

interface StorageLocationSelectProps {
  shopId: string | null;
  value?: string | undefined;
  onSelect: (location: StorageLocation) => void;
}

export function StorageLocationSelect({ shopId, value, onSelect }: StorageLocationSelectProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { isOwner, isReceptionniste } = useUserRoles();
  const { items, loading } = useAsyncList(
    shopId ? `${shopId}:${refreshKey}` : null,
    () => getAvailableLocations(shopId ?? ""),
  );

  useEffect(() => {
    if (!value && items[0]) onSelect(items[0]);
  }, [items, onSelect, value]);

  async function createLocation() {
    if (!shopId) return;
    const name = window.prompt("Nom du nouvel emplacement (ex. C4)")?.trim();
    if (!name) return;

    const { data, error } = await supabase
      .from("storage_locations")
      .insert({
        shop_id: shopId,
        name,
        location_type: "carton",
        status: "available",
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Emplacement ${name} créé.`);
    onSelect(data as StorageLocation);
    setRefreshKey((current) => current + 1);
  }

  const canCreate = isOwner || isReceptionniste;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
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
        </div>
        {canCreate ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => void createLocation()}
            aria-label="Créer un emplacement"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>
      {!loading && items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucun emplacement configuré. Cliquez sur + pour en créer un.
        </p>
      ) : null}
    </div>
  );
}
