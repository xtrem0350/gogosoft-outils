import { SearchableSelect } from "@/components/SearchableSelect";
import { getUserShops, type Shop } from "@/services/shopService";
import { useAsyncList } from "./useAsyncOptions";

interface Props {
  value?: string | undefined;
  onSelect: (shop: Shop) => void;
}

/** Sélection d'un atelier de l'utilisateur. */
export function ShopSelect({ value, onSelect }: Props) {
  const { items, loading } = useAsyncList("shops", getUserShops);
  return (
    <SearchableSelect
      options={items.map((s) => ({
        value: s.id,
        label: s.name,
        description: s.address ?? undefined,
      }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un atelier"
      emptyMessage="Aucun atelier."
      onSelect={(option) => {
        const shop = items.find((s) => s.id === option.value);
        if (shop) onSelect(shop);
      }}
    />
  );
}
