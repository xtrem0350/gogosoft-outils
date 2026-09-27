import { ArrowLeft, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeroProps {
  title: string;
  subtitle?: string | undefined;
  icon?: LucideIcon | undefined;
  imageUrl?: string | undefined;
  showBack?: boolean | undefined;
  action?: React.ReactNode | undefined;
  className?: string | undefined;
  titleClassName?: string | undefined;
  subtitleClassName?: string | undefined;
  iconClassName?: string | undefined;
}

export function PageHero({
  title,
  subtitle,
  icon: Icon = Wrench,
  imageUrl,
  showBack,
  action,
  className = "",
  titleClassName = "text-white",
  subtitleClassName = "text-slate-100",
  iconClassName = "",
}: PageHeroProps) {
  const defaultImage =
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&auto=format&fit=crop";

  return (
    <div
      className={`relative mb-6 h-48 overflow-hidden rounded-2xl bg-slate-900 ${className}`}
    >
      <img
        loading="lazy"
        decoding="async"
        src={imageUrl ?? defaultImage}
        alt=""
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/40 to-green-500/40" />

      {showBack ? (
        <div className="absolute left-4 top-4 z-10">
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

      {action ? (
        <div className="absolute right-4 top-4 z-10">{action}</div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Icon className={`size-6 text-white ${iconClassName}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className={`truncate text-2xl font-bold drop-shadow-lg ${titleClassName}`}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={`mt-0.5 line-clamp-2 text-sm drop-shadow ${subtitleClassName}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
          }
