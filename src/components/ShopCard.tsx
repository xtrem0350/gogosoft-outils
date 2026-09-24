/** Carte d'un atelier du réparateur. */
import { Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Shop } from "@/services/shopService";

interface ShopCardProps {
  shop: Shop;
  isCurrent?: boolean;
}

/** Affiche un atelier avec son adresse et son statut. */
export function ShopCard({ shop, isCurrent = false }: ShopCardProps) {
  return (
    <Card className="border-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Store className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{shop.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shop.address || "Adresse non renseignée"}
            </p>
          </div>
        </div>
        {isCurrent ? (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Active
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
