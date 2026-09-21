/** Sélecteur de boutique actuellement active. */
import { ChevronDown, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentShop } from "@/hooks/useCurrentShop";

/** Sélecteur de boutique affiché dans le header. */
export function ShopSelector() {
  const { shop, shopId, shops, switchShop, loading } = useCurrentShop();

  if (loading || shops.length === 0) {
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
          {shop?.name ?? "Boutique"}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {shops.map((entry) => (
          <DropdownMenuItem key={entry.id} onSelect={() => switchShop(entry.id)}>
            <span className="flex-1">{entry.name}</span>
            {entry.id === shopId ? <span className="text-xs text-primary">Actif</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
