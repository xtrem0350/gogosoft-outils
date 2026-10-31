// src/components/ShopSelector.tsx

/** Sélecteur d'atelier actuellement active. */
import { ChevronDown, Plus, Store } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useUserRoles } from "@/hooks/useUserRoles";

/** Sélecteur d'atelier affiché dans le header. */
export function ShopSelector() {
  const { shop, shopId, shops, switchShop, loading } = useCurrentShop();
  const { isOwner } = useUserRoles();
  const navigate = useNavigate();

  if (loading || shops.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
        onClick={isOwner ? () => void navigate({ to: "/boutiques/nouveau" }) : undefined}
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
          className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
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
        {isOwner ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void navigate({ to: "/boutiques/nouveau" })}>
              <Plus className="mr-2 size-4" />
              Créer une boutique ou atelier
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
