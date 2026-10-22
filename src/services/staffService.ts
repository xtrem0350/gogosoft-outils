import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoMode } from "@/services/demoService";
import type { StaffMember, CreateStaffData, StaffRole } from "@/types/staff";
import type { Database } from "@/integrations/supabase/types";

const DEMO_STAFF_KEY = "gogosoft.demo.staff";

type StaffTable = {
  Row: StaffMember;
  Insert: Omit<StaffMember, "id" | "created_at" | "updated_at"> & {
    id?: string;
    created_at?: string;
    updated_at?: string | null;
  };
  Update: Partial<StaffMember>;
  Relationships: Database["public"]["Tables"]["shop_members"]["Relationships"];
};

type StaffDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<Database["public"]["Tables"], "shop_members"> & {
      shop_members: StaffTable;
    };
  };
};

const staffClient = supabase as unknown as SupabaseClient<StaffDatabase>;

function readDemoStaff(): StaffMember[] {
  try {
    const raw = sessionStorage.getItem(DEMO_STAFF_KEY);
    return raw ? (JSON.parse(raw) as StaffMember[]) : [];
  } catch {
    return [];
  }
}

function writeDemoStaff(staff: StaffMember[]) {
  sessionStorage.setItem(DEMO_STAFF_KEY, JSON.stringify(staff));
}

export async function getStaffByShop(shopId: string): Promise<StaffMember[]> {
  if (isDemoMode()) {
    return readDemoStaff().filter((s) => s.shop_id === shopId);
  }
  const { data, error } = await staffClient
    .from("shop_members")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StaffMember[];
}

export async function getStaffByRole(shopId: string, roles: StaffRole[]): Promise<StaffMember[]> {
  if (isDemoMode()) {
    return readDemoStaff()
      .filter((s) => s.shop_id === shopId && s.is_active && roles.includes(s.role))
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  }
  const { data, error } = await staffClient
    .from("shop_members")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .in("role", roles)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StaffMember[];
}

export async function createStaff(data: CreateStaffData): Promise<StaffMember> {
  if (isDemoMode()) {
    const now = new Date().toISOString();
    const staff: StaffMember = {
      id: crypto.randomUUID(),
      shop_id: data.shop_id,
      user_id: data.user_id ?? null,
      role: data.role,
      full_name: data.full_name,
      phone: data.phone ?? null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    writeDemoStaff([...readDemoStaff(), staff]);
    return staff;
  }
  const { data: staff, error } = await staffClient
    .from("shop_members")
    .insert({
      shop_id: data.shop_id,
      role: data.role,
      full_name: data.full_name,
      phone: data.phone ?? null,
      user_id: data.user_id ?? null,
      is_active: true,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return staff as StaffMember;
}

export async function updateStaff(
  id: string,
  patch: Partial<StaffMember>,
): Promise<StaffMember | null> {
  if (isDemoMode()) {
    const list = readDemoStaff().map((s) =>
      s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s,
    );
    writeDemoStaff(list);
    return list.find((s) => s.id === id) ?? null;
  }
  const { data: staff, error } = await staffClient
    .from("shop_members")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return staff as StaffMember | null;
}

export async function deactivateStaff(id: string): Promise<boolean> {
  if (isDemoMode()) {
    await updateStaff(id, { is_active: false });
    return true;
  }
  const { error } = await staffClient
    .from("shop_members")
    .update({ is_active: false } as never)
    .eq("id", id);
  if (error) throw error;
  return true;
}
