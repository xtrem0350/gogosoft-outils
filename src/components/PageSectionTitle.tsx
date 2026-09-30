import type { LucideIcon } from "lucide-react";

import { IconBadge3D } from "@/components/IconBadge3D";
import { cn } from "@/lib/utils";

interface PageSectionTitleProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color?: "orange" | "green" | "blue" | "red" | "purple";
  className?: string;
}

export function PageSectionTitle({
  icon,
  title,
  subtitle,
  color = "orange",
  className,
}: PageSectionTitleProps) {
  return (
    <div className={cn("mb-2 flex items-center gap-4 py-4 text-left", className)}>
      <IconBadge3D
        icon={icon}
        size="md"
        color={color}
        className="size-14 shrink-0 rounded-xl [&_svg]:size-7"
      />
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}
