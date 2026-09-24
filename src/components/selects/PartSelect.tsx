import { useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAsyncList } from "./useAsyncOptions";

export interface Part {
  id: string;
  name: string;
  quantity: number;
}

type LooseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => Promise<{ data: unknown[] | null; error: unknown }>;
    };
  };
};

/** Charge les pièces (table préparatoire, peut ne pas encore exister). */
async function loadParts(shopId: string): Promise<Part[]> {
  const { data, error } = await (supabase as unknown as LooseClient)
    .from("parts")
    .select("*")
    .eq("shop_id", shopId);
  if (error) return [];
  return (data ?? []) as Part[];
}

/** Sélection d'une pièce en stock. */
export function PartSelect({
  shopId,
  onSelect,
}: {
  shopId: string | null;
  onSelect: (p: Part) => void;
}) {
  const [value, setValue] = useState<string>();
  const { items, loading } = useAsyncList(shopId, () => loadParts(shopId ?? ""));
  return (
    <SearchableSelect
      options={items.map((p) => ({
        value: p.id,
        label: p.name,
        description: `Stock: ${p.quantity}`,
      }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner une pièce"
      onSelect={(option) => {
        const p = items.find((x) => x.id === option.value);
        if (!p) return;
        setValue(option.value);
        onSelect(p);
      }}
    />
  );
}
