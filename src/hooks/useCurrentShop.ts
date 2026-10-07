import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { getUserShops, type Shop } from "@/services/shopService";
import { DEMO_SHOP_ID, DEMO_SHOP_SLUG, DEMO_SESSION_CHANGED_EVENT, readDemoSession } from "@/services/demoService";

const STORAGE_KEY = "gogosoft.currentShopId";
type CurrentShopValue = ReturnType<typeof useCurrentShopState>;
const CurrentShopContext = createContext<CurrentShopValue | null>(null);

function useCurrentShopState() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const loadedUserRef = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async (sessionUserId?: string, force = false) => {
    if (!force && loadedUserRef.current === (sessionUserId ?? null) && !loadingRef.current) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      if (!sessionUserId) {
        const demoSession = readDemoSession();
        if (demoSession) {
          const demoShop: Shop = {
            id: DEMO_SHOP_ID,
            name: "Atelier de démonstration",
            shop_slug: DEMO_SHOP_SLUG,
            is_online_shop: true,
          };
          setShops([demoShop]);
          setShop(demoShop);
          loadedUserRef.current = "demo";
          return;
        }
        setShops([]);
        setShop(null);
        window.localStorage.removeItem(STORAGE_KEY);
        loadedUserRef.current = null;
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
      loadedUserRef.current = sessionUserId;
    } catch {
      setShops([]);
      setShop(null);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncSession = (userId: string | undefined) => {
      if (!mounted) return;
      void refresh(userId);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      syncSession(session?.user.id);
    });
    const onDemoSessionChanged = () => void refresh(undefined, true);
    window.addEventListener(DEMO_SESSION_CHANGED_EVENT, onDemoSessionChanged);

    void supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session?.user.id);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener(DEMO_SESSION_CHANGED_EVENT, onDemoSessionChanged);
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
