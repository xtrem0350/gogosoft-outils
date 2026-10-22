import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_SHOP_ID, DEMO_STORAGE_LOCATIONS_KEY, isDemoMode } from "@/services/demoService";
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

function readDemoLocations(shopId: string): StorageLocation[] {
  const raw = window.sessionStorage.getItem(DEMO_STORAGE_LOCATIONS_KEY);
  if (!raw) return [];
  try {
    const locations: unknown = JSON.parse(raw);
    if (!Array.isArray(locations)) throw new Error("Format de stockage démo invalide.");
    if (
      !locations.every(
        (location) =>
          typeof location === "object" &&
          location !== null &&
          "id" in location &&
          typeof location.id === "string" &&
          "shop_id" in location &&
          typeof location.shop_id === "string" &&
          "name" in location &&
          typeof location.name === "string" &&
          "location_type" in location &&
          typeof location.location_type === "string" &&
          ["carton", "shelf", "drawer", "bag", "other"].includes(location.location_type) &&
          "description" in location &&
          (typeof location.description === "string" || location.description === null) &&
          "status" in location &&
          typeof location.status === "string" &&
          ["available", "occupied", "maintenance"].includes(location.status) &&
          "current_ticket_id" in location &&
          (typeof location.current_ticket_id === "string" || location.current_ticket_id === null) &&
          "created_at" in location &&
          typeof location.created_at === "string" &&
          "updated_at" in location &&
          (typeof location.updated_at === "string" || location.updated_at === null),
      )
    ) {
      throw new Error("Emplacements démo invalides.");
    }
    return locations.filter(
      (location): location is StorageLocation =>
        location.shop_id === shopId,
    );
  } catch (error) {
    console.error("[storageService] readDemoLocations:", error);
    return [];
  }
}

function saveDemoLocations(locations: StorageLocation[]): void {
  try {
    window.sessionStorage.setItem(DEMO_STORAGE_LOCATIONS_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error("[storageService] saveDemoLocations:", error);
    throw new Error("Impossible d'enregistrer cet emplacement en mode démo.");
  }
}

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
  if (isDemoMode()) return readDemoLocations(shopId);
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
  if (isDemoMode()) {
    return readDemoLocations(shopId).filter((location) => location.status === "available");
  }
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

export async function getLocationByTicketId(ticketId: string): Promise<StorageLocation | null> {
  if (isDemoMode()) {
    return readDemoLocations(DEMO_SHOP_ID).find((location) => location.current_ticket_id === ticketId) ?? null;
  }
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
): Promise<StorageLocation> {
  if (!(await hasSession("createLocation"))) {
    if (isDemoMode()) {
      const now = new Date().toISOString();
      const location: StorageLocation = {
        id: crypto.randomUUID(),
        shop_id: data.shop_id,
        name: data.name,
        location_type: data.location_type,
        description: data.description?.trim() || null,
        status: "available",
        current_ticket_id: null,
        created_at: now,
        updated_at: now,
      };
      saveDemoLocations([...readDemoLocations(data.shop_id), location]);
      return location;
    }
    throw new Error("Connectez-vous pour créer un emplacement.");
  }
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
    throw new Error(
      error instanceof Error ? error.message : "Impossible d'enregistrer cet emplacement.",
    );
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
  if (isDemoMode()) {
    const locations = readDemoLocations(DEMO_SHOP_ID);
    const location = locations.find((entry) => entry.id === locationId);
    if (!location) return null;
    const freed = {
      ...location,
      status: "available" as const,
      current_ticket_id: null,
      updated_at: new Date().toISOString(),
    };
    saveDemoLocations(locations.map((entry) => (entry.id === locationId ? freed : entry)));
    return freed;
  }
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
