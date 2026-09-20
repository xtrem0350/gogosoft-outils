import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  note?: string;
  className?: string;
}

/** Carte d'indicateur utilisée sur le tableau de bord et les statistiques. */
export function StatsCard({ label, value, icon: Icon, note, className }: StatsCardProps) {
  return (
    <Card className={cn("card-elevated border-0", className)}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold">{value}</p>
          {note ? <p className="mt-2 truncate text-xs text-muted-foreground">{note}</p> : null}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
