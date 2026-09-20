import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolActions } from "@/components/tools/ToolActions";
import { ToolBadges } from "@/components/tools/ToolBadges";
import { ToolImage } from "@/components/tools/ToolImage";
import { slideUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types/database";

export interface ToolCardProps {
  tool: Tool;
  view?: "grid" | "list";
  onEdit?: (tool: Tool) => void;
  onDelete?: (tool: Tool) => void;
  onDuplicate?: (tool: Tool) => void;
  onToggleFavori?: (tool: Tool) => void;
}

/** Carte d'outil réutilisable, en vue grille ou en vue liste. */
export function ToolCard({
  tool,
  view = "grid",
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavori,
}: ToolCardProps) {
  const favoriteButton = (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      aria-label={tool.favori ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggleFavori?.(tool);
      }}
    >
      <Star className={cn("size-4", tool.favori && "fill-warning text-warning")} />
    </Button>
  );

  return (
    <motion.div variants={slideUp} initial="initial" animate="animate">
      <Card className="card-elevated hover-lift border-0">
        <CardContent
          className={cn(
            "gap-4 p-4",
            view === "grid" ? "flex flex-col" : "flex flex-row items-center",
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ToolImage tool={tool} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/outils/$id"
                  params={{ id: tool.id }}
                  className="truncate font-semibold hover:text-primary"
                >
                  {tool.nom}
                </Link>
                {favoriteButton}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {tool.version ? `v${tool.version} · ` : ""}
                {tool.sous_categorie ?? tool.categorie}
              </p>
              <ToolBadges tool={tool} className="mt-2" />
              {view === "grid" && tool.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
              ) : null}
              <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">
                {tool.chemin}
              </p>
            </div>
          </div>
          <div className={cn(view === "grid" && "border-t border-border/60 pt-3")}>
            <ToolActions
              tool={tool}
              compact={view === "list"}
              {...(onEdit ? { onEdit } : {})}
              {...(onDelete ? { onDelete } : {})}
              {...(onDuplicate ? { onDuplicate } : {})}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
