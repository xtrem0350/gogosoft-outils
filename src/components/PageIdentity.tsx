import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  FolderTree,
  Home,
  Laptop,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  User,
  Users,
  Wrench,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pageIcons: Array<[string, LucideIcon]> = [
  ["/salles/commandes", ShoppingCart],
  ["/phone", Smartphone],
  ["/computer", Laptop],
  ["/consumable", Package],
  ["/sales", ShoppingCart],
  ["/salles", ShoppingCart],
  ["/clients", Users],
  ["/outils", Wrench],
  ["/categories", FolderTree],
  ["/equipe", Users],
  ["/boutiques", Store],
  ["/abonnement", CreditCard],
  ["/profil", User],
  ["/parametres", Settings],
  ["/statistiques", Activity],
  ["/historique", Activity],
  ["/atelier", Wrench],
  ["/admin", Settings],
  ["/", LayoutDashboard],
];

export function getPageIcon(pathname: string): LucideIcon {
  return (
    pageIcons.find(
      ([route]) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
    )?.[1] ?? Home
  );
}

export function PageIdentity({
  title,
  subtitle,
  icon: Icon,
  className,
  titleClassName,
  subtitleClassName,
  iconClassName,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className={cn("flex items-center gap-3 text-3xl font-bold", titleClassName)}>
        <Icon aria-hidden="true" className={cn("size-7 shrink-0", iconClassName)} />
        <span>{title}</span>
      </h1>
      {subtitle ? (
        <p className={cn("flex items-start gap-2 text-sm", subtitleClassName)}>
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{subtitle}</span>
        </p>
      ) : null}
    </div>
  );
}
