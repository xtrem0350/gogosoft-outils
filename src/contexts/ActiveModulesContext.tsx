import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useShopModules } from "@/hooks/useShopModules";
import { disableShopModule, enableShopModules, getShopModules } from "@/services/moduleService";
import { isDemoMode, updateDemoModules } from "@/services/demoService";
import { notifyShopModulesChanged } from "@/hooks/useShopModules";
import { MODULES, moduleIdsFromShopCodes, shopCodesFromModuleIds, type ModuleId } from "@/types/modules";

interface ActiveModulesValue {
  activeModules: ModuleId[];
  isModuleActive: (id: ModuleId) => boolean;
  isAnyActive: (ids: ModuleId[]) => boolean;
  isDemo: boolean;
  setActiveModules: (ids: ModuleId[]) => void;
  loading: boolean;
}

const ActiveModulesContext = createContext<ActiveModulesValue | null>(null);

export function ActiveModulesProvider({ children }: { children: ReactNode }) {
  const { shopId, shops } = useCurrentShop();
  const { modules: shopCodes, loading } = useShopModules();
  const demo = isDemoMode();
  const activeModules = useMemo(() => {
    const ids = moduleIdsFromShopCodes(shopCodes);
    if (!demo && shops.length > 1 && !ids.includes("multi-ateliers")) {
      ids.push("multi-ateliers");
    }
    return ids;
  }, [demo, shopCodes, shops.length]);
  const activeSet = new Set(activeModules);

  const value = useMemo<ActiveModulesValue>(
    () => ({
      activeModules,
      isModuleActive: (id) => activeSet.has(id),
      isAnyActive: (ids) => ids.some((id) => activeSet.has(id)),
      isDemo: demo,
      loading,
      setActiveModules: (ids) => {
        const codes = shopCodesFromModuleIds(ids);
        if (demo) {
          updateDemoModules(codes);
          return;
        }
        if (!shopId) return;
        void (async () => {
          const current = await getShopModules(shopId);
          const next = new Set(codes);
          await enableShopModules(shopId, codes);
          await Promise.all(
            current.filter((code) => MODULES[moduleIdsFromShopCodes([code])[0] ?? "multi-ateliers"]
              .shopModuleCodes.includes(code) && !next.has(code))
              .map((code) => disableShopModule(shopId, code)),
          );
          notifyShopModulesChanged(shopId);
        })();
      },
    }),
    [activeModules, activeSet, demo, loading, shopId],
  );

  return <ActiveModulesContext.Provider value={value}>{children}</ActiveModulesContext.Provider>;
}

export function useActiveModules(): ActiveModulesValue {
  const value = useContext(ActiveModulesContext);
  if (!value) throw new Error("useActiveModules doit être utilisé dans ActiveModulesProvider");
  return value;
}