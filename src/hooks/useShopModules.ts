import { useCallback, useEffect, useState } from "react";

import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getShopModules } from "@/services/moduleService";
import {
  DEMO_SESSION_CHANGED_EVENT,
  DEMO_SHOP_ID,
  getDemoModuleCodes,
  isDemoMode,
} from "@/services/demoService";
import {
  isSimulationMode,
  readSimulationShop,
  SIMULATION_CHANGED_EVENT,
} from "@/services/simulationService";
import { MODULE_IDS, shopCodesFromModuleIds } from "@/types/modules";
import { supabase } from "@/integrations/supabase/client";

const MODULES_CHANGED_EVENT = "gogosoft:shop-modules-changed";

export function notifyShopModulesChanged(shopId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODULES_CHANGED_EVENT, { detail: { shopId } }));
}

export function useShopModules() {
  const { shopId, shop, loading: shopLoading } = useCurrentShop();
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isSimulationMode()) {
      const simulatedModules = readSimulationShop()?.modules ?? [];
      const moduleIds = MODULE_IDS.filter((id) =>
        id !== "consommables" &&
        id !== "multi-ateliers" &&
        simulatedModules.includes(id),
      );
      setModules(shopCodesFromModuleIds(moduleIds));
      setLoading(false);
      return;
    }
    if (isDemoMode()) {
      setModules(getDemoModuleCodes());
      setLoading(false);
      return;
    }
    // Juste après la sortie de démo, shopId peut encore valoir l'atelier fictif : aucune requête réelle.
    if (!shopId || shopId === DEMO_SHOP_ID) {
      setModules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const nextModules = await getShopModules(shopId);
      if (isSimulationMode()) return;
      if (nextModules.length === 0 && shop?.owner_id) {
        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("selected_modules, storefront_modules")
          .eq("user_id", shop.owner_id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (subscriptionError) throw subscriptionError;
        if (subscription) {
          const fallbackModules = [
            ...((subscription.selected_modules ?? []) as string[]),
            ...((subscription.storefront_modules ?? []) as string[]),
          ];
          if (fallbackModules.length > 0) {
            setModules(fallbackModules);
            console.warn("[useShopModules] fallback subscriptions utilisé pour shop", shopId);
            return;
          }
        }
      }
      setModules(nextModules);
    } catch (error) {
      if (isSimulationMode()) return;
      console.error("[useShopModules]", error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [shop, shopId]);

  useEffect(() => {
    if (shopLoading) {
      setLoading(true);
      return;
    }
    void refresh();
  }, [refresh, shopLoading]);

  useEffect(() => {
    const handleDemoChanged = () => void refresh();
    const handleSimulationChanged = () => void refresh();
    window.addEventListener(DEMO_SESSION_CHANGED_EVENT, handleDemoChanged);
    window.addEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
    const handleModulesChanged = (event: Event) => {
      const changedShopId = (event as CustomEvent<{ shopId: string }>).detail?.shopId;
      if (changedShopId === shopId) void refresh();
    };
    window.addEventListener(MODULES_CHANGED_EVENT, handleModulesChanged);
    return () => {
      window.removeEventListener(MODULES_CHANGED_EVENT, handleModulesChanged);
      window.removeEventListener(DEMO_SESSION_CHANGED_EVENT, handleDemoChanged);
      window.removeEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
    };
  }, [refresh, shopId]);

  const hasModule = useCallback((code: string) => modules.includes(code), [modules]);

  return { modules, hasModule, loading: shopLoading || loading, refresh };
}
