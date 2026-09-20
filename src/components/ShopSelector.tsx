/** Sélecteur de boutique actuellement active. */
import { ChevronDown, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserShops } from "@/services/shopService";

const STORAGE_KEY = "gogosoft.currentShopId";

/** Sélecteur de boutique affiché dans le header. */
export function ShopSelector() {
  const [shops, setShops] = useState<Array<{ id: string; name: string }>>([]);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setCurrentShopId(saved);

    void getUserShops()
      .then((data) => {
        setShops(data as Array<{ id: string; name: string }>);
        if (!saved && data[0]?.id) {
          setCurrentShopId(data[0].id);
          window.localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (currentShopId) {
      window.localStorage.setItem(STORAGE_KEY, currentShopId);
    }
  }, [currentShopId]);

  const currentShop = useMemo(
    () => shops.find((shop) => shop.id === currentShopId) ?? shops[0] ?? null,
    [currentShopId, shops],
  );

  if (shops.length === 0) {
    return (
      <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
        <Store className="size-4" />
        Boutique
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          <Store className="size-4" />
          {currentShop?.name ?? "Boutique"}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {shops.map((shop) => (
          <DropdownMenuItem key={shop.id} onSelect={() => setCurrentShopId(shop.id)}>
            <span className="flex-1">{shop.name}</span>
            {shop.id === currentShopId ? <span className="text-xs text-primary">Actif</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
