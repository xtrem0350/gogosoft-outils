import { supabase } from "@/integrations/supabase/client";

export type DeviceCatalogCategory = "smartphone" | "tablet" | "laptop" | "desktop" | "other";
export type DeviceCatalogType = "phone" | "computer" | "tablet" | "other";

export interface DeviceCatalogItem {
  id: string;
  brand: string;
  model: string;
  category: DeviceCatalogCategory;
  os: string | null;
  release_year: number | null;
  image_url: string | null;
  specs: Record<string, unknown>;
  popularity_ci: number | null;
  created_at: string;
}

export type DeviceCatalogResult = DeviceCatalogItem & {
  characteristics: Record<string, unknown>;
};

export type AddDeviceCatalogInput = Omit<DeviceCatalogItem, "id" | "created_at">;

function normalizeDevice(device: DeviceCatalogItem): DeviceCatalogResult {
  return { ...device, characteristics: device.specs };
}

export async function getDeviceCatalog(
  categories?: DeviceCatalogCategory[] | DeviceCatalogType,
): Promise<DeviceCatalogResult[]> {
  let query = (supabase.from("device_catalog" as any) as any).select("*").order("brand");
  if (Array.isArray(categories) && categories.length > 0) {
    query = query.in("category", categories);
  } else if (categories === "phone") {
    query = query.eq("category", "smartphone");
  } else if (categories === "computer") {
    query = query.in("category", ["laptop", "desktop"]);
  } else if (categories) {
    query = query.eq("category", categories);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[deviceCatalog] getDeviceCatalog error:", error);
    throw error;
  }
  console.log("[deviceCatalog] getDeviceCatalog count:", data?.length);
  return ((data ?? []) as DeviceCatalogItem[]).map(normalizeDevice);
}

export async function addDeviceToCatalog(input: AddDeviceCatalogInput): Promise<DeviceCatalogResult> {
  const { data, error } = await (supabase.from("device_catalog" as any) as any)
    .insert({
      brand: input.brand.trim(),
      model: input.model.trim(),
      category: input.category,
      os: input.os?.trim() || null,
      release_year: input.release_year,
      image_url: input.image_url?.trim() || null,
      specs: input.specs,
      popularity_ci: input.popularity_ci,
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeDevice(data as DeviceCatalogItem);
}

export async function searchDevices(
  query: string,
  categories?: DeviceCatalogCategory[],
): Promise<DeviceCatalogResult[]> {
  const search = query.trim();
  let request = (supabase.from("device_catalog" as any) as any)
    .select("*")
    .order("brand");
  if (categories && categories.length > 0) request = request.in("category", categories);
  if (search) request = request.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
  const { data, error } = await request;
  if (error) throw error;
  return ((data ?? []) as DeviceCatalogItem[]).map(normalizeDevice);
}
