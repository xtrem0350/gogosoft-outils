export const SIMULATION_ACTIVE_KEY = "gogosoft.simulation.active";
export const SIMULATION_PAYMENT_KEY = "gogosoft.simulation.payment";
export const SIMULATION_SHOP_KEY = "gogosoft.simulation.shop";
export const SIMULATION_CHANGED_EVENT = "gogosoft:simulation-changed";

export interface SimulationShop {
  id: string;
  name: string;
  owner_id?: string;
  modules: string[];
  domain: string;
  created_at: string;
}

export interface SimulationPayment {
  invoice_number: string;
  plan_id: string;
  plan_price: number;
  modules: string[];
  domain_name: string;
  total_amount: number;
  payment_status: string;
  paid_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSimulationShop(value: unknown): SimulationShop | null {
  if (!isRecord(value)) return null;

  const modules = value["modules"];
  if (
    typeof value["id"] !== "string" ||
    typeof value["name"] !== "string" ||
    !Array.isArray(modules) ||
    typeof value["domain"] !== "string" ||
    typeof value["created_at"] !== "string"
  ) {
    return null;
  }

  return {
    id: value["id"],
    name: value["name"],
    owner_id: typeof value["owner_id"] === "string" ? value["owner_id"] : "sim-user",
    modules: modules.filter((module): module is string => typeof module === "string"),
    domain: value["domain"],
    created_at: value["created_at"],
  };
}

function parseSimulationPayment(value: unknown): SimulationPayment | null {
  if (!isRecord(value)) return null;

  const modules = value["modules"];
  if (
    typeof value["invoice_number"] !== "string" ||
    typeof value["plan_id"] !== "string" ||
    typeof value["plan_price"] !== "number" ||
    !Array.isArray(modules) ||
    typeof value["domain_name"] !== "string" ||
    typeof value["total_amount"] !== "number" ||
    typeof value["payment_status"] !== "string" ||
    typeof value["paid_at"] !== "string"
  ) {
    return null;
  }

  return {
    invoice_number: value["invoice_number"],
    plan_id: value["plan_id"],
    plan_price: value["plan_price"],
    modules: modules.filter((module): module is string => typeof module === "string"),
    domain_name: value["domain_name"],
    total_amount: value["total_amount"],
    payment_status: value["payment_status"],
    paid_at: value["paid_at"],
  };
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
    const shop = parseSimulationShop(JSON.parse(serialized));
    if (!shop) throw new Error("Données de boutique simulée invalides.");
    return shop;
  } catch (error) {
    console.error("[Simulation] Impossible de lire la boutique simulée.", error);
    return null;
  }
}

export function readSimulationPayment(): SimulationPayment | null {
  if (typeof window === "undefined") return null;
  const serialized = window.sessionStorage.getItem(SIMULATION_PAYMENT_KEY);
  if (!serialized) return null;

  try {
    const payment = parseSimulationPayment(JSON.parse(serialized));
    if (!payment) throw new Error("Données de paiement simulé invalides.");
    return payment;
  } catch (error) {
    console.error("[Simulation] Impossible de lire le paiement simulé.", error);
    return null;
  }
}

export function notifySimulationChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SIMULATION_CHANGED_EVENT));
  }
}
