import { Apple, Cpu, HardDrive, ImageOff, Plug, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { useState } from "react";

import { scaleIn } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Categorie, Tool } from "@/types/database";

export interface ToolImageProps {
  tool: Tool;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  className?: string;
  imageUrl?: string | null;
}

const categoryIcons: Record<Categorie, ComponentType<{ className?: string }>> = {
  MTK: Cpu,
  Unisoc: HardDrive,
  Apple,
  Drivers: Plug,
  Autres: Wrench,
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-40 w-40",
  xl: "h-80 w-full",
} as const;

function ToolPlaceholder({ tool, imageUrl }: { tool: Tool; imageUrl?: string | null }) {
  const Icon = categoryIcons[tool.categorie as Categorie] ?? Wrench;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary text-primary">
      {imageUrl ? <ImageOff className="size-7 opacity-60" /> : <Icon className="size-10" />}
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
        {tool.categorie}
      </span>
    </div>
  );
}

/** Image d'un outil avec placeholder de catégorie et fallback de chargement. */
export function ToolImage({ tool, size = "md", onClick, className, imageUrl }: ToolImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const interactive = onClick !== undefined;
  const imageProps = imageUrl === undefined ? {} : { imageUrl };
  const content =
    imageUrl && !imageFailed ? (
      <img
        loading="lazy"
        decoding="async"
        src={imageUrl}
        alt={`Logo de ${tool.nom}`}
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
      />
    ) : (
      <ToolPlaceholder {...imageProps} tool={tool} />
    );

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      {...(interactive ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.98 } } : {})}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-border shadow-sm",
        sizeClasses[size],
        interactive &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Afficher ${tool.nom}` : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (interactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {imageUrl && !imageFailed ? content : <ToolPlaceholder {...imageProps} tool={tool} />}
    </motion.div>
  );
}
