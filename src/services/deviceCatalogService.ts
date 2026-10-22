import { supabase } from "@/integrations/supabase/client";

export type DeviceCatalogType = "phone" | "computer" | "tablet" | "other";

export interface DeviceCatalogItem {
  id: string;
  brand: string;
  model: string;
  device_type: DeviceCatalogType;
  os: string | null;
  image_url: string | null;
  characteristics: Record<string, unknown>;
  is_active: boolean;
}

export type AddDeviceCatalogInput = Omit<DeviceCatalogItem, "id" | "is_active">;

export async function getDeviceCatalog(deviceType?: DeviceCatalogType): Promise<DeviceCatalogItem[]> {
  let query = (supabase.from("device_catalog" as any) as any)
    .select("*")
    .eq("is_active", true)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });
  if (deviceType) query = query.eq("device_type", deviceType);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DeviceCatalogItem[];
}

export async function addDeviceToCatalog(input: AddDeviceCatalogInput): Promise<DeviceCatalogItem> {
  const { data, error } = await (supabase.from("device_catalog" as any) as any)
    .insert({
      brand: input.brand.trim(),
      model: input.model.trim(),
      device_type: input.device_type,
      os: input.os?.trim() || null,
      image_url: input.image_url?.trim() || null,
      characteristics: input.characteristics,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DeviceCatalogItem;
}

export async function searchDevices(query: string): Promise<DeviceCatalogItem[]> {
  const search = query.trim();
  let request = (supabase.from("device_catalog" as any) as any)
    .select("*")
    .eq("is_active", true)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });
  if (search) {
    request = request.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as DeviceCatalogItem[];
}
