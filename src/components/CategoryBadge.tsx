import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Categorie } from "@/types/database";

const categoryClasses: Record<string, string> = {
  MTK: "border-cat-mtk/30 bg-cat-mtk/10 text-cat-mtk",
  Unisoc: "border-cat-unisoc/30 bg-cat-unisoc/10 text-cat-unisoc",
  Apple: "border-cat-apple/30 bg-cat-apple/10 text-cat-apple",
  Drivers: "border-cat-drivers/30 bg-cat-drivers/10 text-cat-drivers",
  Autres: "border-cat-autres/30 bg-cat-autres/10 text-cat-autres",
};

/** Badge coloré représentant la catégorie d'un outil. */
export function CategoryBadge({
  categorie,
  className,
}: {
  categorie: Categorie | string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(categoryClasses[categorie], className)}>
      {categorie}
    </Badge>
  );
}
