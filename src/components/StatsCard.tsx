import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title?: string;
  label?: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  note?: string;
  color?: string;
  className?: string;
}

/** Carte d'indicateur utilisée sur le tableau de bord et les statistiques. */
export function StatsCard({
  title,
  label,
  value,
  icon: Icon,
  trend,
  note,
  color,
  className,
}: StatsCardProps) {
  const cardLabel = title ?? label ?? "Statistique";
  const detail = trend ?? note;

  return (
    <Card className={cn("card-elevated border-0", className)}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{cardLabel}</p>
          <p className="mt-3 font-display text-3xl font-bold">{value}</p>
          {detail ? <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <div
          className={cn(
            "rounded-lg bg-primary/10 p-2.5 text-primary",
            color === "success" && "bg-emerald-100 text-emerald-700",
            color === "warning" && "bg-amber-100 text-amber-700",
            color === "danger" && "bg-red-100 text-red-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
