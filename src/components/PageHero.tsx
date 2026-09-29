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
  className,
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
      <div className="relative z-10 flex min-h-40 flex-col items-start justify-center gap-3 px-6 py-6 text-left sm:min-h-44 sm:px-8 sm:py-7">
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
        {action ? <div className="absolute right-4 top-4 sm:right-6 sm:top-1/2 sm:-translate-y-1/2">{action}</div> : null}

        {icon ? <IconBadge3D icon={icon} size="md" color={iconColor} className="size-14 rounded-xl [&_svg]:size-7" /> : null}

        <h1 className={cn("max-w-[calc(100%-3rem)] text-2xl font-bold drop-shadow-lg sm:max-w-[calc(100%-12rem)] sm:text-3xl", titleClassName)}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("max-w-2xl text-sm text-white/90 drop-shadow sm:text-base", subtitleClassName)}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
