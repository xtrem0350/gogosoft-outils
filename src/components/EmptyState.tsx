import type { LucideIcon } from "lucide-react";

import { IconBadge3D } from "@/components/IconBadge3D";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/80 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <IconBadge3D
          icon={Icon}
          size="lg"
          color="orange"
          className="mb-5 size-16 rounded-2xl [&_svg]:size-8"
        />

        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>

        {actionLabel && onAction ? (
          <Button
            className="mt-6 h-11 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d active:scale-95 hover:bg-ivoirien-hover"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
