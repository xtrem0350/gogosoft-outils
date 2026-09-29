import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface IconBadge3DProps {
  icon: LucideIcon;
  size?: "md" | "lg" | "xl";
  color?: "orange" | "green" | "blue" | "red" | "purple";
  className?: string;
}

export function IconBadge3D({
  icon: Icon,
  size = "lg",
  color = "orange",
  className,
}: IconBadge3DProps) {
  const sizeClasses = { md: "size-18", lg: "size-24", xl: "size-32" };
  const iconSizes = { md: "size-9", lg: "size-12", xl: "size-16" };
  const gradients = {
    orange: "bg-gradient-to-br from-orange-400 to-orange-600",
    green: "bg-gradient-to-br from-green-400 to-green-600",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600",
    red: "bg-gradient-to-br from-red-400 to-red-600",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        gradients[color],
        "flex items-center justify-center rounded-2xl shadow-3d transition-transform duration-300 hover:scale-105",
        className,
      )}
    >
      <Icon className={cn(iconSizes[size], "text-white drop-shadow-lg")} strokeWidth={2} />
    </div>
  );
}
