/** Sélecteur d'atelier actuellement active. */
import { ChevronDown, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentShop } from "@/hooks/useCurrentShop";

/** Sélecteur d'atelier affiché dans le header. */
export function ShopSelector() {
  const { shop, shopId, shops, switchShop, loading } = useCurrentShop();

  if (loading || shops.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-orange-200 bg-white text-slate-800 hover:bg-orange-50 hover:text-orange-700 dark:bg-slate-800 dark:text-white"
      >
        <Store className="size-4" />
        Sélectionner un atelier...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-orange-200 bg-white text-slate-800 hover:bg-orange-50 hover:text-orange-700 dark:bg-slate-800 dark:text-white"
        >
          <Store className="size-4" />
          {shop?.name ?? "Sélectionner un atelier..."}
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
