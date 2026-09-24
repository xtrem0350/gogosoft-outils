import { useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { getShopMembers } from "@/services/shopService";
import { useAsyncList } from "./useAsyncOptions";

export interface MemberOption {
  user_id: string;
  role: string;
  name: string;
}

interface Props {
  shopId: string | null;
  onSelect: (member: MemberOption) => void;
}

/** Charge les membres et leur nom depuis les profils. */
async function loadMembers(shopId: string): Promise<MemberOption[]> {
  const members = (await getShopMembers(shopId)) as Array<{ user_id: string; role: string }>;
  const ids = members.map((m) => m.user_id);
  const { data } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
    : { data: [] };
  return members.map((m) => {
    const p = (data ?? []).find((x) => x.id === m.user_id);
    return {
      user_id: m.user_id,
      role: m.role,
      name: p?.full_name || p?.email || m.user_id.slice(0, 8),
    };
  });
}

/** Sélection d'un membre de l'atelier. */
export function MemberSelect({ shopId, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const { items, loading } = useAsyncList(shopId, () => loadMembers(shopId ?? ""));
  return (
    <SearchableSelect
      options={items.map((m) => ({ value: m.user_id, label: m.name, description: m.role }))}
      value={value}
      loading={loading}
      placeholder="Sélectionner un membre"
      emptyMessage="Aucun membre."
      onSelect={(option) => {
        const member = items.find((m) => m.user_id === option.value);
        if (!member) return;
        setValue(option.value);
        onSelect(member);
      }}
    />
  );
}
