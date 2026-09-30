import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { getClientPhotoUrl, getClientsByShop, type ClientRecord } from "@/services/clientService";
import { useAsyncList } from "./useAsyncOptions";

interface Props {
  shopId: string | null;
  value?: string | undefined;
  selectedClient?: ClientRecord | undefined;
  onSelect: (client: ClientRecord) => void;
  onCreateNew?: () => void;
}

/** Sélection d'un client existant de l'atelier. */
export function ClientSelect({ shopId, value, selectedClient, onSelect, onCreateNew }: Props) {
  const navigate = useNavigate();
  const { items, loading } = useAsyncList(shopId, () => getClientsByShop(shopId ?? ""));
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const optionsItems = selectedClient
    ? [...items.filter((client) => client.id !== selectedClient.id), selectedClient]
    : items;

  useEffect(() => {
    let active = true;
    const clients = selectedClient
      ? [...items.filter((client) => client.id !== selectedClient.id), selectedClient]
      : items;
    void Promise.all(
      clients.map(async (client) => [client.id, await getClientPhotoUrl(client)] as const),
    ).then((photos) => {
      if (active) {
        setPhotoUrls(
          Object.fromEntries(
            photos.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
          ),
        );
      }
    });
    return () => {
      active = false;
    };
  }, [items, selectedClient]);

  return (
    <SearchableSelect
      options={optionsItems.map((client) => ({
        value: client.id,
        label: client.full_name,
        description: client.whatsapp,
        icon: photoUrls[client.id] ? (
          <img
            src={photoUrls[client.id]}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {client.full_name.slice(0, 1).toUpperCase()}
          </span>
        ),
      }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un client"
      searchPlaceholder="Nom ou WhatsApp..."
      emptyMessage="Aucun client trouvé."
      createLabel="Créer un nouveau client"
      onCreateNew={onCreateNew ?? (() => void navigate({ to: "/clients/nouveau" }))}
      onSelect={(option) => {
        const client = optionsItems.find((item) => item.id === option.value);
        if (client) onSelect(client);
      }}
    />
  );
}
