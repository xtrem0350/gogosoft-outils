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
    <Card className={cn("card-3d rounded-2xl border-0", className)}>
      <CardContent className="flex min-w-0 items-center gap-4 p-6">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700",
            color === "success" && "bg-emerald-100 text-emerald-700",
            color === "warning" && "bg-amber-100 text-amber-700",
            color === "danger" && "bg-rose-100 text-rose-700",
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cardLabel}</p>
          <p className="mt-2 truncate font-display text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {detail ? <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
