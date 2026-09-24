import { useNavigate } from "@tanstack/react-router";

import { SearchableSelect } from "@/components/SearchableSelect";
import { getClientsByShop, type ClientRecord } from "@/services/clientService";
import { useAsyncList } from "./useAsyncOptions";

interface Props {
  shopId: string | null;
  value?: string | undefined;
  onSelect: (client: ClientRecord) => void;
  onCreateNew?: () => void;
}

/** Sélection d'un client existant de l'atelier. */
export function ClientSelect({ shopId, value, onSelect, onCreateNew }: Props) {
  const navigate = useNavigate();
  const { items, loading } = useAsyncList(shopId, () => getClientsByShop(shopId ?? ""));
  return (
    <SearchableSelect
      options={items.map((c) => ({ value: c.id, label: c.full_name, description: c.whatsapp }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un client"
      searchPlaceholder="Nom ou WhatsApp..."
      emptyMessage="Aucun client trouvé."
      createLabel="Créer un nouveau client"
      onCreateNew={onCreateNew ?? (() => void navigate({ to: "/clients/nouveau" }))}
      onSelect={(option) => {
        const client = items.find((c) => c.id === option.value);
        if (client) onSelect(client);
      }}
    />
  );
}
