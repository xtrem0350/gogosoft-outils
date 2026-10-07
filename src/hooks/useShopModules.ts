import { useCallback, useEffect, useState } from "react";

import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getShopModules } from "@/services/moduleService";
import {
  DEMO_SESSION_CHANGED_EVENT,
  getDemoModuleCodes,
  isDemoMode,
} from "@/services/demoService";

const MODULES_CHANGED_EVENT = "gogosoft:shop-modules-changed";

export function notifyShopModulesChanged(shopId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODULES_CHANGED_EVENT, { detail: { shopId } }));
}

export function useShopModules() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      setModules(getDemoModuleCodes());
      setLoading(false);
      return;
    }
    if (!shopId) {
      setModules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setModules(await getShopModules(shopId));
    } catch (error) {
      console.error("[useShopModules]", error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopLoading) {
      setLoading(true);
      return;
    }
    void refresh();
  }, [refresh, shopLoading]);

  useEffect(() => {
    const handleDemoChanged = () => void refresh();
    window.addEventListener(DEMO_SESSION_CHANGED_EVENT, handleDemoChanged);
    const handleModulesChanged = (event: Event) => {
      const changedShopId = (event as CustomEvent<{ shopId: string }>).detail?.shopId;
      if (changedShopId === shopId) void refresh();
    };
    window.addEventListener(MODULES_CHANGED_EVENT, handleModulesChanged);
    return () => {
      window.removeEventListener(MODULES_CHANGED_EVENT, handleModulesChanged);
      window.removeEventListener(DEMO_SESSION_CHANGED_EVENT, handleDemoChanged);
    };
  }, [refresh, shopId]);

  const hasModule = useCallback((code: string) => modules.includes(code), [modules]);

  return { modules, hasModule, loading: shopLoading || loading, refresh };
}
