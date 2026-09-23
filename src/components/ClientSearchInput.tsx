import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchClients, type ClientRecord } from "@/services/clientService";

interface ClientSearchInputProps {
  shopId: string | null;
  onSelect: (client: ClientRecord) => void;
  onCreateNew: () => void;
  placeholder?: string;
}

/** Champ de recherche d'un client existant avec suggestions. */
export function ClientSearchInput({
  shopId,
  onSelect,
  onCreateNew,
  placeholder = "Ex: Awa Koné ou 0707070707",
}: ClientSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shopId || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      void searchClients(shopId, query)
        .then((list) => {
          if (cancelled) return;
          setResults(list);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, shopId]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Recherche…</p>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onSelect(client);
                      setQuery(client.full_name);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{client.full_name}</span>{" "}
                    <span className="text-muted-foreground">{client.whatsapp}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onCreateNew();
                setOpen(false);
              }}
            >
              <UserPlus className="size-4" />
              Aucun client trouvé. Cliquez pour créer un nouveau client.
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
