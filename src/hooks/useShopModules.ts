import { useCallback, useEffect, useState } from "react";

import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getShopModules } from "@/services/moduleService";

export function useShopModules() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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

  const hasModule = useCallback((code: string) => modules.includes(code), [modules]);

  return { modules, hasModule, loading: shopLoading || loading, refresh };
}