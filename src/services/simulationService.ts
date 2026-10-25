export const SIMULATION_ACTIVE_KEY = "gogosoft.simulation.active";
export const SIMULATION_PAYMENT_KEY = "gogosoft.simulation.payment";
export const SIMULATION_SHOP_KEY = "gogosoft.simulation.shop";
export const SIMULATION_CHANGED_EVENT = "gogosoft:simulation-changed";

export interface SimulationShop {
  id: string;
  name: string;
  owner_id: string;
  modules: string[];
  domain: string;
  created_at: string;
}

export function isSimulationMode(): boolean {
  return typeof window !== "undefined" &&
    window.sessionStorage.getItem(SIMULATION_ACTIVE_KEY) === "true";
}

export function readSimulationShop(): SimulationShop | null {
  if (typeof window === "undefined") return null;
  const serialized = window.sessionStorage.getItem(SIMULATION_SHOP_KEY);
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value) ||
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      !Array.isArray(value.modules) ||
      typeof value.domain !== "string" ||
      typeof value.created_at !== "string"
    ) {
      throw new Error("Données de boutique simulée invalides.");
    }

    return {
      id: value.id,
      name: value.name,
      owner_id: typeof value.owner_id === "string" ? value.owner_id : "sim-user",
      modules: value.modules.filter((module): module is string => typeof module === "string"),
      domain: value.domain,
      created_at: value.created_at,
    };
  } catch (error) {
    console.error("[Simulation] Impossible de lire la boutique simulée.", error);
    return null;
  }
}

export function notifySimulationChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SIMULATION_CHANGED_EVENT));
  }
}
