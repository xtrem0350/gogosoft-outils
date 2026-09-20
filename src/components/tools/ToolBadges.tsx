import { Archive, CheckCircle2, FileBox, Folder, Star, TestTube2, XCircle } from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Categorie, Tool, ToolType } from "@/types/database";

const categoryClasses: Record<string, string> = {
  MTK: "border-cat-mtk/30 bg-cat-mtk/10 text-cat-mtk",
  Unisoc: "border-cat-unisoc/30 bg-cat-unisoc/10 text-cat-unisoc",
  Apple: "border-cat-apple/30 bg-cat-apple/10 text-cat-apple",
  Drivers: "border-cat-drivers/30 bg-cat-drivers/10 text-cat-drivers",
  Autres: "border-cat-autres/30 bg-cat-autres/10 text-cat-autres",
};

const typeLabels: Record<string, string> = {
  exe: "Exécutable",
  archive: "Archive",
  dossier: "Dossier",
};

const typeIcons: Record<string, ComponentType<{ className?: string }>> = {
  exe: FileBox,
  archive: Archive,
  dossier: Folder,
};

/** Badges métier communs affichés sur les cartes et les lignes d'outils. */
export function ToolBadges({
  tool,
  className,
  status,
}: {
  tool: Tool;
  className?: string;
  status?: "actif" | "en_test" | "deprecie" | "recommande";
}) {
  const TypeIcon = typeIcons[tool.type] ?? FileBox;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge variant="outline" className={categoryClasses[tool.categorie]}>
        {tool.categorie as Categorie}
      </Badge>
      <Badge variant="outline" className="gap-1">
        <TypeIcon className="size-3" aria-hidden="true" />
        {typeLabels[tool.type] ?? tool.type}
      </Badge>
      {status === "recommande" && (
        <Badge className="gap-1 bg-info text-white hover:bg-info/90">
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Recommandé
        </Badge>
      )}
      {status === "actif" && (
        <Badge className="gap-1 bg-success text-white hover:bg-success/90">
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Actif
        </Badge>
      )}
      {status === "en_test" && (
        <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning/90">
          <TestTube2 className="size-3" aria-hidden="true" />
          En test
        </Badge>
      )}
      {status === "deprecie" && (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" aria-hidden="true" />
          Déprécié
        </Badge>
      )}
      {tool.favori && (
        <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
          <Star className="size-3 fill-current" aria-hidden="true" />
          Favori
        </Badge>
      )}
    </div>
  );
}
