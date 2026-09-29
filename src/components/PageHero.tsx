import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconBadge3D } from "@/components/IconBadge3D";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: "orange" | "green" | "blue" | "red" | "purple";
  imageUrl?: string;
  showBack?: boolean;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function PageHero({
  title,
  subtitle,
  icon,
  iconColor = "orange",
  imageUrl,
  showBack = false,
  action,
  className = "",
  titleClassName = "text-white",
  subtitleClassName = "text-slate-100",
}: PageHeroProps) {
  const defaultImage =
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&auto=format&fit=crop";

  return (
    <div
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl bg-slate-900 shadow-3d",
        className,
      )}
    >
      <img
        loading="lazy"
        decoding="async"
        src={imageUrl ?? defaultImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/70 via-orange-800/50 to-green-900/60" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        {showBack ? (
          <div className="absolute left-4 top-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.history.back()}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Button>
          </div>
        ) : null}
        {action ? <div className="absolute right-4 top-4">{action}</div> : null}

        {icon ? <IconBadge3D icon={icon} size="xl" color={iconColor} /> : null}

        <h1 className={cn("text-3xl font-bold drop-shadow-lg md:text-4xl", titleClassName)}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("max-w-2xl text-sm text-white/90 drop-shadow md:text-base", subtitleClassName)}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
