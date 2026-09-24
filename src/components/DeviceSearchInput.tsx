import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchDevices, type KnownDevice } from "@/services/workshopService";

interface DeviceSearchInputProps {
  shopId: string | null;
  onSelect: (device: KnownDevice) => void;
  placeholder?: string;
}

/** Champ de recherche d'un appareil déjà connu de la boutique. */
export function DeviceSearchInput({
  shopId,
  onSelect,
  placeholder = "Ex: IMEI, numéro de série ou Samsung Galaxy A12",
}: DeviceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnownDevice[]>([]);
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
      void searchDevices(shopId, query)
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
      <Smartphone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
              {results.map((device, index) => (
                <li
                  key={`${device.device_imei ?? device.device_sn ?? device.device_model}-${index}`}
                >
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onSelect(device);
                      setQuery(device.device_model);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{device.device_model}</span>{" "}
                    <span className="text-muted-foreground">
                      {device.device_imei ?? device.device_sn ?? "sans IMEI"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Nouvel appareil. Remplissez les champs ci-dessous.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
