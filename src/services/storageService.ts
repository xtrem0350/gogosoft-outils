import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StorageLocationType = "carton" | "shelf" | "drawer" | "bag" | "other";
export type StorageLocationStatus = "available" | "occupied" | "maintenance";

export interface StorageLocation {
  id: string;
  shop_id: string;
  name: string;
  location_type: StorageLocationType;
  description: string | null;
  status: StorageLocationStatus;
  current_ticket_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateStorageLocationData {
  shop_id: string;
  name: string;
  location_type: StorageLocationType;
  description?: string;
}

type StorageTable = {
  Row: StorageLocation;
  Insert: CreateStorageLocationData;
  Update: Partial<StorageLocation>;
  Relationships: [];
};

type StorageDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & { storage_locations: StorageTable };
  };
};

const storageClient = supabase as unknown as SupabaseClient<StorageDatabase>;

async function hasSession(functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error(`[storageService] ${functionName}: session`, error);
      return false;
    }
    return Boolean(data.session);
  } catch (error) {
    console.error(`[storageService] ${functionName}: session`, error);
    return false;
  }
}

export async function getLocationsByShop(shopId: string): Promise<StorageLocation[]> {
  if (!(await hasSession("getLocationsByShop"))) return [];
  try {
    const { data, error } = await storageClient
      .from("storage_locations")
      .select("*")
      .eq("shop_id", shopId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("[storageService] getLocationsByShop:", error);
    return [];
  }
}

export async function getAvailableLocations(shopId: string): Promise<StorageLocation[]> {
  if (!(await hasSession("getAvailableLocations"))) return [];
  try {
    const { data, error } = await storageClient
      .from("storage_locations")
      .select("*")
      .eq("shop_id", shopId)
      .eq("status", "available")
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("[storageService] getAvailableLocations:", error);
    return [];
  }
}

export async function getLocationById(id: string): Promise<StorageLocation | null> {
  if (!(await hasSession("getLocationById"))) return null;
  try {
    const { data, error } = await storageClient
      .from("storage_locations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[storageService] getLocationById:", error);
    return null;
  }
}

export async function getLocationByTicketId(
  ticketId: string,
): Promise<StorageLocation | null> {
  if (!(await hasSession("getLocationByTicketId"))) return null;
  try {
    const { data, error } = await storageClient
      .from("storage_locations")
      .select("*")
      .eq("current_ticket_id", ticketId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[storageService] getLocationByTicketId:", error);
    return null;
  }
}

export async function createLocation(
  data: CreateStorageLocationData,
): Promise<StorageLocation | null> {
  if (!(await hasSession("createLocation"))) return null;
  try {
    const { data: location, error } = await storageClient
      .from("storage_locations")
      .insert({ ...data, description: data.description?.trim() || null } as never)
      .select("*")
      .single();
    if (error) throw error;
    return location;
  } catch (error) {
    console.error("[storageService] createLocation:", error);
    return null;
  }
}

export async function updateLocation(
  id: string,
  data: Partial<StorageLocation>,
): Promise<StorageLocation | null> {
  if (!(await hasSession("updateLocation"))) return null;
  try {
    const { data: location, error } = await storageClient
      .from("storage_locations")
      .update(data as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return location;
  } catch (error) {
    console.error("[storageService] updateLocation:", error);
    return null;
  }
}

export async function deleteLocation(id: string): Promise<boolean> {
  if (!(await hasSession("deleteLocation"))) return false;
  try {
    const { error } = await storageClient.from("storage_locations").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[storageService] deleteLocation:", error);
    return false;
  }
}

export async function assignTicketToLocation(
  ticketId: string,
  locationId: string,
): Promise<StorageLocation | null> {
  if (!(await hasSession("assignTicketToLocation"))) return null;
  try {
    const { data: destination, error: lookupError } = await storageClient
      .from("storage_locations")
      .select("*")
      .eq("id", locationId)
      .eq("status", "available")
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!destination) throw new Error("Cet emplacement n'est plus libre.");

    const { error: releaseError } = await storageClient
      .from("storage_locations")
      .update({ status: "available", current_ticket_id: null } as never)
      .eq("current_ticket_id", ticketId);
    if (releaseError) throw releaseError;

    const { data, error } = await storageClient
      .from("storage_locations")
      .update({ status: "occupied", current_ticket_id: ticketId } as never)
      .eq("id", locationId)
      .eq("status", "available")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Cet emplacement vient d'être attribué à une autre fiche.");
    return data;
  } catch (error) {
    console.error("[storageService] assignTicketToLocation:", error);
    return null;
  }
}

export async function freeLocation(locationId: string): Promise<StorageLocation | null> {
  if (!(await hasSession("freeLocation"))) return null;
  try {
    const { data, error } = await storageClient
      .from("storage_locations")
      .update({ status: "available", current_ticket_id: null } as never)
      .eq("id", locationId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[storageService] freeLocation:", error);
    return null;
  }
}
