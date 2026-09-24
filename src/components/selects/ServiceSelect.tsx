import { useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAsyncList } from "./useAsyncOptions";

export interface ServicePrice {
  id: string;
  service_name: string;
  price: number;
}

type LooseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => Promise<{ data: unknown[] | null; error: unknown }>;
    };
  };
};

/** Charge les tarifs de service (table préparatoire, peut ne pas encore exister). */
async function loadServices(shopId: string): Promise<ServicePrice[]> {
  const { data, error } = await (supabase as unknown as LooseClient)
    .from("service_prices")
    .select("*")
    .eq("shop_id", shopId);
  if (error) return [];
  return (data ?? []) as ServicePrice[];
}

/** Sélection d'un service tarifé. */
export function ServiceSelect({ shopId, onSelect }: { shopId: string | null; onSelect: (s: ServicePrice) => void }) {
  const [value, setValue] = useState<string>();
  const { items, loading } = useAsyncList(shopId, () => loadServices(shopId ?? ""));
  return (
    <SearchableSelect
      options={items.map((s) => ({ value: s.id, label: s.service_name, description: `${s.price} FCFA` }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un service"
      onSelect={(option) => {
        const s = items.find((x) => x.id === option.value);
        if (!s) return;
        setValue(option.value);
        onSelect(s);
      }}
    />
  );
}
