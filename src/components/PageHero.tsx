import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  showBack?: boolean;
}

export function PageHero({ title, subtitle, imageUrl, showBack = false }: PageHeroProps) {
  const navigate = useNavigate();

  return (
    <div className="relative mb-6 h-48 overflow-hidden rounded-2xl bg-slate-900">
      <img loading="lazy" decoding="async" src={imageUrl} alt={title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/20" />
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
      <div className="absolute inset-x-0 bottom-0 z-10 p-6">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-200">{subtitle}</p> : null}
      </div>
    </div>
  );
}
