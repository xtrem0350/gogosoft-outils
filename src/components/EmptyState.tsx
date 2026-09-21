import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/80 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
          <Icon className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>

        {actionLabel && onAction ? (
          <Button className="mt-6" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
