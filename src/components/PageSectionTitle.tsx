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
    <div className={cn("mb-4 flex flex-col items-center gap-3 py-8 text-center", className)}>
      <IconBadge3D icon={icon} size="xl" color={color} />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">{title}</h2>
      {subtitle ? <p className="max-w-md text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
