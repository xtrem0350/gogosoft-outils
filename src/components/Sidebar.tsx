import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  FolderTree,
  History,
  Home,
  Laptop,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Smartphone,
  ShoppingCart,
  Settings,
  Store,
  User,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopModules } from "@/hooks/useShopModules";
import { signOut } from "@/services/authService";

type NavigationItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  search?: { activityType: "phone" | "computer" };
};
type NavigationGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavigationItem[];
};

function getNavigationGroups(modules: string[]): NavigationGroup[] {
  const groups: NavigationGroup[] = [
    {
      label: "ACCUEIL",
      icon: Home,
      items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
    },
  ];

  if (modules.includes("phone_repair")) {
    groups.push({
      label: "TÉLÉPHONE",
      icon: Smartphone,
      items: [
        { label: "Fiches", to: "/phone/atelier", icon: Smartphone },
        { label: "Nouvelle fiche", to: "/phone/atelier/nouveau", icon: PlusCircle },
        { label: "Plan de l'atelier", to: "/atelier/plan", icon: Package },
        { label: "Carnet d'expérience", to: "/phone/carnet", icon: History },
        { label: "Historique", to: "/phone/historique", icon: History },
      ],
    });
  }

  if (modules.includes("computer_repair")) {
    groups.push({
      label: "ORDINATEUR",
      icon: Laptop,
      items: [
        { label: "Fiches", to: "/computer/atelier", icon: Laptop },
        { label: "Nouvelle fiche", to: "/computer/atelier/nouveau", icon: PlusCircle },
        { label: "Carnet d'expérience", to: "/computer/carnet", icon: History },
        { label: "Historique", to: "/computer/historique", icon: History },
      ],
    });
  }

  for (const [code, label, activityType] of [
    ["phone_sale", "VENTE MOBILE", "phone"],
    ["computer_sale", "VENTE PC", "computer"],
  ] as const) {
    if (!modules.includes(code)) continue;
    groups.push({
      label,
      icon: ShoppingCart,
      items: [
        { label: "Mes ventes", to: "/sales", icon: ShoppingCart, search: { activityType } },
        { label: "Nouvelle vente", to: "/sales/nouveau", icon: PlusCircle },
        { label: "Commandes", to: "/sales/commandes", icon: Package },
      ],
    });
  }

  if (modules.includes("consumable")) {
    groups.push({
      label: "CONSOMMABLES",
      icon: Package,
      items: [
        { label: "Stock", to: "/consumable/stock", icon: Package },
        { label: "Nouveau produit", to: "/consumable/stock/nouveau", icon: PlusCircle },
        { label: "Historique", to: "/consumable/historique", icon: History },
      ],
    });
  }

  groups.push(
    {
      label: "CLIENTS",
      icon: Users,
      items: [
        { label: "Liste", to: "/clients", icon: Users },
        { label: "Nouveau client", to: "/clients/nouveau", icon: UserPlus },
      ],
    },
    {
      label: "MON COMPTE",
      icon: Settings,
      items: [
        { label: "Outils", to: "/outils", icon: Wrench },
        { label: "Catégories", to: "/categories", icon: FolderTree },
        { label: "Mes ateliers", to: "/boutiques", icon: Store },
        { label: "Équipe", to: "/equipe", icon: UserCog },
        { label: "Aide", to: "/aide", icon: CircleHelp },
        { label: "Profil", to: "/profil", icon: User },
        { label: "Forfait", to: "/abonnement", icon: Settings },
        { label: "Mes modules", to: "/parametres", icon: Package },
        { label: "Paramètres", to: "/parametres", icon: Settings },
      ],
    },
    {
      label: "MA BOUTIQUE",
      icon: Store,
      items: [
        { label: "Configuration", to: "/admin/boutique", icon: Store },
        { label: "Produits", to: "/admin/boutique/produits", icon: Package },
        { label: "Commandes", to: "/admin/boutique/commandes", icon: ShoppingCart },
      ],
    },
  );

  return groups;
}

/** Navigation principale de l'espace de travail. */
export function Sidebar({ mobileTrigger }: { mobileTrigger?: ReactNode } = {}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routeSearch = useRouterState({ select: (state) => state.location.search });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { modules, loading: modulesLoading } = useShopModules();
  const navigationGroups = getNavigationGroups(modules);
  const activeGroup = navigationGroups.findIndex((group) =>
    group.items.some(
      (item) =>
        (pathname === item.to || pathname.startsWith(`${item.to}/`)) &&
        (!item.search ||
          (routeSearch as { activityType?: string }).activityType === item.search.activityType),
    ),
  );
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ [activeGroup]: true });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (activeGroup < 0) return;
    setOpenGroups({ [activeGroup]: true });
  }, [activeGroup]);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        window.sessionStorage.removeItem(key);
      }
    }
    await navigate({ to: "/auth" });
  }

  const links = (
    <nav className="space-y-1" aria-label="Navigation principale">
      {navigationGroups.map(({ label, icon: GroupIcon, items }, groupIndex) => {
        const filteredItems = items.filter((item) =>
          `${label} ${item.label}`.toLowerCase().includes(search.trim().toLowerCase()),
        );
        if (search.trim() && filteredItems.length === 0) return null;
        return (
          <Collapsible
            key={label}
            open={openGroups[groupIndex] ?? false}
            onOpenChange={(isOpen) =>
              setOpenGroups((current) => ({ ...current, [groupIndex]: isOpen }))
            }
          >
            <CollapsibleTrigger
              title={label}
              className={cn(
                "group flex h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <GroupIcon
                className={cn(
                  "size-4",
                  activeGroup === groupIndex ? "text-orange-600" : "text-slate-500",
                )}
              />
              {!collapsed ? <span className="flex-1">{label}</span> : null}
              {!collapsed ? (
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              ) : null}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {filteredItems.map(({ label: itemLabel, to, icon: Icon, search: itemSearch }) => (
                <Link
                  key={to}
                  to={to}
                  search={itemSearch ?? {}}
                  onClick={() => setOpen(false)}
                  title={itemLabel}
                  className={cn(
                    "flex h-10 items-center gap-3 border-l-4 border-transparent px-3 py-2 pl-7 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-sidebar-foreground/65 dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center border-l-0 px-0",
                    pathname === to &&
                      "border-orange-500 bg-orange-50 font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      pathname === to ? "text-orange-600" : "text-slate-500",
                    )}
                  />
                  {!collapsed ? <span className="min-w-0 flex-1 truncate">{itemLabel}</span> : null}
                  {!collapsed && pathname === to ? (
                    <span className="ml-auto size-2 shrink-0 rounded-full bg-orange-500 animate-pulse" />
                  ) : null}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );

  const signOutButton = (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      aria-label="Déconnexion"
      title="Déconnexion"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <LogOut className="size-4" />
      {!collapsed ? "Déconnexion" : null}
    </button>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px] px-2" : "w-[260px] px-4",
        )}
      >
        <div
          className={cn(
            "mb-3 flex shrink-0 items-center justify-between border-b border-sidebar-border px-2 pb-4",
            collapsed && "flex-col justify-center gap-2 px-0",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <AnimatedLogo compact />
            {!collapsed ? (
              <span className="truncate font-display text-sm font-semibold">GogoSoft</span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Afficher la barre latérale" : "Masquer la barre latérale"}
            title={collapsed ? "Afficher la barre latérale" : "Masquer la barre latérale"}
            onClick={() => setCollapsed((value) => !value)}
            className="size-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
        {!collapsed ? (
          <div className="relative mb-3 shrink-0 border-b border-sidebar-border pb-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un module..."
              aria-label="Rechercher dans le menu"
              className="h-9 border-sidebar-border bg-sidebar-accent pl-3 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {modulesLoading ? <Skeleton className="h-full min-h-48 w-full" /> : links}
        </div>
        <div className="mt-4 shrink-0 border-t border-sidebar-border pt-4">{signOutButton}</div>
      </aside>

      {mobileTrigger ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{mobileTrigger}</SheetTrigger>
          <SheetContent
            side="left"
            className="flex h-dvh max-h-dvh w-72 flex-col overflow-hidden bg-sidebar text-sidebar-foreground"
          >
            <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-sidebar-border pb-4">
              <AnimatedLogo compact />
              <SheetTitle className="font-display text-sm">GogoSoft</SheetTitle>
            </div>
            <div className="relative mb-3 shrink-0 border-b border-sidebar-border pb-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un module..."
                aria-label="Rechercher dans le menu"
                className="h-9 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border">
              {modulesLoading ? <Skeleton className="h-full min-h-48 w-full" /> : links}
            </div>
            <div className="mt-8 shrink-0 border-t border-sidebar-border pt-4">{signOutButton}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
