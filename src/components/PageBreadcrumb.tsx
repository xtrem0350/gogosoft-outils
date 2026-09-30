import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  to?: string | undefined;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string | undefined;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <nav
      className={cn("flex items-center gap-2 text-sm text-white/80", className)}
      aria-label="Fil d'Ariane"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-white")}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight className="size-3 opacity-60" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
