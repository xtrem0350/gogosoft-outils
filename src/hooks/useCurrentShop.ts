import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession } from "@/lib/supabaseGuard";
import { getUserShops, type Shop } from "@/services/shopService";

const STORAGE_KEY = "gogosoft.currentShopId";
type CurrentShopValue = ReturnType<typeof useCurrentShopState>;
const CurrentShopContext = createContext<CurrentShopValue | null>(null);

function useCurrentShopState() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!(await hasActiveSession())) {
        setShops([]);
        setShop(null);
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const nextShops = await getUserShops();
      setShops(nextShops);

      const stored = window.localStorage.getItem(STORAGE_KEY);
      const activeShop = nextShops.find((entry) => entry.id === stored) ?? nextShops[0] ?? null;

      setShop(activeShop);

      if (activeShop) {
        window.localStorage.setItem(STORAGE_KEY, activeShop.id);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setShops([]);
      setShop(null);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refresh]);

  const switchShop = useCallback(
    (shopId: string) => {
      const nextShop = shops.find((entry) => entry.id === shopId) ?? null;
      setShop(nextShop);
      if (nextShop) {
        window.localStorage.setItem(STORAGE_KEY, nextShop.id);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
    [shops],
  );

  return useMemo(
    () => ({
      shop,
      shopId: shop?.id ?? null,
      shops,
      switchShop,
      loading,
      refresh,
    }),
    [shop, shops, switchShop, loading, refresh],
  );
}

export function CurrentShopProvider({ children }: { children: ReactNode }) {
  const value = useCurrentShopState();
  return createElement(CurrentShopContext.Provider, { value }, children);
}

export function useCurrentShop() {
  const context = useContext(CurrentShopContext);
  if (!context) throw new Error("useCurrentShop doit être utilisé dans <CurrentShopProvider>");
  return context;
}
