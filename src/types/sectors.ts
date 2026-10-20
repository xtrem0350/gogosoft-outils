import type { ModuleId } from "@/types/modules";

export type SectorModuleId = Exclude<ModuleId, "multi-ateliers">;

export type SectorCategory = "reparation" | "vente" | "vitrine";
export type SectorDevice = "telephone" | "pc";

export interface SectorVocabulary {
  moduleId: SectorModuleId;
  label: string;
  category: SectorCategory;
  device: SectorDevice;

  client: string;
  clientPlural: string;
  order: string;
  orderPlural: string;
  product: string;
  productPlural: string;
  issue: string;
  issuePlural: string;
  price: string;
  amount: string;
  cost: string;
  exit: string;
  cash: string;

  technician: string;
  technicianPlural: string;
  employee: string;
  employeePlural: string;
  manager: string;
  managerPlural: string;

  place: string;
  placePlural: string;
  storage: string;
  storagePlural: string;

  hasCart: boolean;
  hasDelivery: boolean;
  hasDiagnostic: boolean;
  hasWarranty: boolean;
  hasInPersonSale: boolean;
  hasOnlineSale: boolean;

  paymentModes: string[];
}
