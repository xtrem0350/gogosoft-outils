import { useMemo } from "react";

import { useActiveModules } from "@/contexts/ActiveModulesContext";

export type DeviceCategory = "smartphone" | "tablet" | "laptop" | "desktop" | "other";

export interface AvailableCategories {
  categories: DeviceCategory[];
  hasPhones: boolean;
  hasComputers: boolean;
  hasTablets: boolean;
}

const ALL_CATEGORIES: DeviceCategory[] = ["smartphone", "tablet", "laptop", "desktop", "other"];

export function useAvailableCategories(): AvailableCategories {
  const { activeModules } = useActiveModules();

  return useMemo(() => {
    const categories = new Set<DeviceCategory>();

    if (activeModules.includes("reparation-telephone") || activeModules.includes("vente-telephone") ||
      activeModules.includes("vitrine-telephone")) {
      categories.add("smartphone");
      categories.add("tablet");
    }

    if (activeModules.includes("reparation-pc") || activeModules.includes("vente-pc") ||
      activeModules.includes("vitrine-pc")) {
      categories.add("laptop");
      categories.add("desktop");
    }

    if (activeModules.includes("consommables")) categories.add("other");

    const result = Array.from(categories);
    const available = result.length > 0 ? result : ALL_CATEGORIES;
    return {
      categories: available,
      hasPhones: available.includes("smartphone"),
      hasComputers: available.includes("laptop") || available.includes("desktop"),
      hasTablets: available.includes("tablet"),
    };
  }, [activeModules]);
}
