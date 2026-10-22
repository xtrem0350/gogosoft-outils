import { useEffect, useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { getStaffByRole } from "@/services/staffService";
import { getShopMembers } from "@/services/shopService";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/types/staff";
import { useAsyncList } from "./useAsyncOptions";

export interface MemberOption {
  user_id: string;
  role: string;
  name: string;
}

interface Props {
  shopId: string | null;
  onSelect: (member: MemberOption) => void;
  refreshKey?: number;
  selectedUserId?: string | undefined;
  filterRoles?: StaffRole[];
}

/** Charge les membres et leur nom depuis les profils. */
async function loadMembers(shopId: string, filterRoles?: StaffRole[]): Promise<MemberOption[]> {
  if (filterRoles !== undefined) {
    const staff = await getStaffByRole(shopId, filterRoles);
    return staff.map((member) => ({
      user_id: member.user_id ?? member.id,
      role: member.role,
      name: member.full_name ?? "Sans nom",
    }));
  }

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

function isStaffRole(role: string): role is StaffRole {
  return Object.prototype.hasOwnProperty.call(STAFF_ROLE_LABELS, role);
}

/** Sélection d'un membre de l'atelier. */
export function MemberSelect({
  shopId,
  onSelect,
  refreshKey = 0,
  selectedUserId,
  filterRoles,
}: Props) {
  const [value, setValue] = useState<string | undefined>(selectedUserId);
  const listKey = shopId ? `${shopId}:${refreshKey}:${filterRoles?.join(",") ?? "all"}` : null;
  const { items, loading } = useAsyncList(listKey, () => loadMembers(shopId ?? "", filterRoles));

  useEffect(() => {
    setValue(selectedUserId);
  }, [selectedUserId]);

  return (
    <SearchableSelect
      options={items.map((member) => ({
        value: member.user_id,
        label: `${member.name || "Sans nom"} (${
          isStaffRole(member.role) ? STAFF_ROLE_LABELS[member.role] : member.role
        })`,
      }))}
      value={value}
      loading={loading}
      placeholder={
        items.length === 0 && !loading ? "Aucun employé disponible" : "Sélectionner un membre"
      }
      emptyMessage="Aucun employé disponible"
      onSelect={(option) => {
        const member = items.find((item) => item.user_id === option.value);
        if (!member) return;
        setValue(option.value);
        onSelect(member);
      }}
    />
  );
}
