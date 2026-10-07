export type ModuleId =
  | "reparation-telephone"
  | "reparation-pc"
  | "vente-telephone"
  | "vente-pc"
  | "consommables"
  | "vitrine-telephone"
  | "vitrine-pc"
  | "multi-ateliers";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  category: "reparation" | "vente" | "vitrine" | "stock" | "systeme";
  routes: string[];
  sidebarKeys: string[];
  icon: string;
  shopModuleCodes: string[];
  demoCode?: string;
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  "reparation-telephone": {
    id: "reparation-telephone",
    label: "Réparation Téléphone",
    description: "Interventions et suivi des téléphones",
    category: "reparation",
    routes: ["/phone/atelier", "/phone/carnet", "/phone/historique", "/atelier/plan"],
    sidebarKeys: ["phone_repair"],
    icon: "Smartphone",
    shopModuleCodes: ["repair_phone"],
  },
  "reparation-pc": {
    id: "reparation-pc",
    label: "Réparation PC",
    description: "Interventions et suivi des ordinateurs",
    category: "reparation",
    routes: ["/computer/atelier", "/computer/carnet", "/computer/historique"],
    sidebarKeys: ["computer_repair"],
    icon: "Laptop",
    shopModuleCodes: ["repair_computer"],
  },
  "vente-telephone": {
    id: "vente-telephone",
    label: "Ventes Téléphone",
    description: "Vendre des téléphones et suivre les commandes",
    category: "vente",
    routes: ["/sales"],
    sidebarKeys: ["phone_sale"],
    icon: "ShoppingCart",
    shopModuleCodes: ["sale_phone"],
  },
  "vente-pc": {
    id: "vente-pc",
    label: "Ventes PC",
    description: "Vendre des ordinateurs et suivre les commandes",
    category: "vente",
    routes: ["/sales"],
    sidebarKeys: ["computer_sale"],
    icon: "ShoppingCart",
    shopModuleCodes: ["sale_computer"],
  },
  consommables: {
    id: "consommables",
    label: "Consommables",
    description: "Gérer le stock de pièces et accessoires",
    category: "stock",
    routes: ["/consumable"],
    sidebarKeys: ["consumable"],
    icon: "Package",
    shopModuleCodes: ["consumable"],
  },
  "vitrine-telephone": {
    id: "vitrine-telephone",
    label: "Vitrine Téléphone",
    description: "Présenter et vendre des téléphones en ligne",
    category: "vitrine",
    routes: ["/shop"],
    sidebarKeys: ["shop_phone"],
    icon: "Smartphone",
    shopModuleCodes: ["shop_phone"],
  },
  "vitrine-pc": {
    id: "vitrine-pc",
    label: "Vitrine PC",
    description: "Présenter et vendre des ordinateurs en ligne",
    category: "vitrine",
    routes: ["/shop"],
    sidebarKeys: ["shop_computer"],
    icon: "Laptop",
    shopModuleCodes: ["shop_computer"],
  },
  "multi-ateliers": {
    id: "multi-ateliers",
    label: "Multi-ateliers",
    description: "Gérer plusieurs ateliers",
    category: "systeme",
    routes: ["/boutiques"],
    sidebarKeys: ["multi_shop"],
    icon: "Store",
    shopModuleCodes: [],
    demoCode: "multi_ateliers",
  },
};

export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export function moduleIdsFromShopCodes(codes: string[]): ModuleId[] {
  return MODULE_IDS.filter((id) =>
    MODULES[id].shopModuleCodes.some((code) => codes.includes(code)) ||
    Boolean(MODULES[id].demoCode && codes.includes(MODULES[id].demoCode!)),
  );
}

export function shopCodesFromModuleIds(ids: ModuleId[]): string[] {
  return [...new Set(ids.flatMap((id) => MODULES[id].shopModuleCodes))];
}

export function demoCodesFromModuleIds(ids: ModuleId[]): string[] {
  return [...new Set(ids.flatMap((id) => [...MODULES[id].shopModuleCodes, MODULES[id].demoCode ?? ""]))].filter(Boolean);
}