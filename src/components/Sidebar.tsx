import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  BookOpen,
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
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/services/authService";
import { DEMO_SHOP_SLUG, endDemo, isDemoMode } from "@/services/demoService";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useSectorVocabulary } from "@/hooks/useSectorVocabulary";
import { usePendingItems } from "@/hooks/usePendingItems";
import type { ModuleId } from "@/types/modules";
import type { SectorVocabulary } from "@/types/sectors";

type NavigationItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  search?: { activityType?: "phone" | "computer"; category?: "phone" | "computer" };
};
type NavigationGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavigationItem[];
};

function getNavigationGroups(
  activeModules: ModuleId[],
  isDemo: boolean,
  shopSlug: string | null,
  hasShop: boolean,
  vocabulary: SectorVocabulary,
  role: UserRole | string | null,
): NavigationGroup[] {
  const hasModule = (id: ModuleId) => activeModules.includes(id);
  const groups: NavigationGroup[] = [
    {
      label: "ACCUEIL",
      icon: Home,
      items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
    },
  ];

  if (role === null) {
    groups.push({
      label: "ACCÈS PAR DÉFAUT",
      icon: Home,
      items: [
        { label: "Caisse", to: "/caisse", icon: Wallet },
        { label: "Réception", to: "/reception", icon: UserRound },
        { label: "Magasin", to: "/magasin", icon: Package },
        { label: "Ventes", to: "/sales", icon: ShoppingCart },
      ],
    });
  }

  if (role === "technicien") {
    if (hasModule("reparation-telephone")) {
      groups.push({ label: "TÉLÉPHONE", icon: Smartphone, items: [
        { label: "Mes fiches", to: "/phone/atelier", icon: Smartphone },
        { label: "Nouvelle fiche", to: "/phone/atelier/nouveau", icon: PlusCircle },
        { label: "Historique", to: "/phone/historique", icon: History },
        { label: "Carnet", to: "/phone/carnet", icon: History },
      ] });
    }
    if (hasModule("reparation-pc")) {
      groups.push({ label: "ORDINATEUR", icon: Laptop, items: [
        { label: "Mes fiches", to: "/computer/atelier", icon: Laptop },
        { label: "Nouvelle fiche", to: "/computer/atelier/nouveau", icon: PlusCircle },
        { label: "Historique", to: "/computer/historique", icon: History },
        { label: "Carnet", to: "/computer/carnet", icon: History },
      ] });
    }
    return groups;
  }

  if (role === "caissier") {
    const cashierGroups: NavigationGroup[] = [
      groups[0]!,
      {
        label: "CAISSE",
        icon: Wallet,
        items: [{ label: "Encaissements", to: "/caisse", icon: Wallet }],
      },
    ];
    return cashierGroups;
  }

  if (role === "magasinier") {
    return [
      groups[0]!,
      {
        label: "STOCK",
        icon: Package,
        items: [
          { label: "Magasin", to: "/magasin", icon: Package },
          ...(hasModule("consommables")
            ? [{ label: "Stock consommables", to: "/consumable/stock", icon: Package }]
            : []),
        ],
      },
    ];
  }

  if (role === "receptionniste") {
    const receptionItems: NavigationItem[] = [
      { label: "Accueil réception", to: "/reception", icon: UserRound },
      ...(hasModule("reparation-telephone")
        ? [{ label: "Réception téléphone", to: "/phone/atelier/nouveau", icon: Smartphone }]
        : []),
      ...(hasModule("reparation-pc")
        ? [{ label: "Réception ordinateur", to: "/computer/atelier/nouveau", icon: Laptop }]
        : []),
    ];
    return [
      groups[0]!,
      ...(receptionItems.length ? [{ label: "RÉCEPTION", icon: UserRound, items: receptionItems }] : []),
    ];
  }

  if (role === "vendeur") {
    const salesItems: NavigationItem[] = [
      ...(hasModule("vente-telephone")
        ? [{ label: "Ventes téléphone", to: "/sales", icon: Smartphone, search: { activityType: "phone" as const } }]
        : []),
      ...(hasModule("vente-pc")
        ? [{ label: "Ventes ordinateur", to: "/sales", icon: Laptop, search: { activityType: "computer" as const } }]
        : []),
      ...(hasModule("vente-telephone") || hasModule("vente-pc")
        ? [{ label: "Nouvelle vente", to: "/sales/nouveau", icon: PlusCircle }]
        : []),
    ];
    return [
      groups[0]!,
      ...(salesItems.length ? [{ label: "VENTES", icon: ShoppingCart, items: salesItems }] : []),
    ];
  }

  if (isDemo && hasShop) {
    groups.push({
      label: "PERSONNEL",
      icon: Users,
      items: [{ label: "Personnel", to: "/personnel", icon: Users }],
    });
  }

  if (hasModule("reparation-telephone")) {
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

  if (hasModule("reparation-pc")) {
    const computerLabel =
      vocabulary.device === "pc" && vocabulary.category === "reparation"
        ? vocabulary.product
        : "Ordinateur";
    groups.push({
      label: computerLabel.toLocaleUpperCase(),
      icon: Laptop,
      items: [
        { label: `Fiches ${computerLabel.toLocaleLowerCase()}`, to: "/computer/atelier", icon: Laptop },
        { label: `Nouvelle fiche ${computerLabel.toLocaleLowerCase()}`, to: "/computer/atelier/nouveau", icon: PlusCircle },
        { label: "Carnet d'expérience", to: "/computer/carnet", icon: History },
        { label: "Historique", to: "/computer/historique", icon: History },
      ],
    });
  }

  for (const [moduleId, label, activityType] of [
    ["vente-telephone", "VENTE MOBILE", "phone"],
    ["vente-pc", "VENTE PC", "computer"],
  ] as const) {
    if (!hasModule(moduleId)) continue;
    const SaleIcon = activityType === "computer" ? Laptop : ShoppingCart;
    groups.push({
      label,
      icon: SaleIcon,
      items: [
        { label: "Mes ventes", to: "/sales", icon: SaleIcon, search: { activityType } },
        { label: "Nouvelle vente", to: "/sales/nouveau", icon: PlusCircle },
        { label: "Commandes", to: "/sales/commandes", icon: Package },
      ],
    });
  }

  if (hasModule("consommables")) {
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

  const storefrontItems: NavigationItem[] = [];
  const publicShopSlug = shopSlug ?? DEMO_SHOP_SLUG;
  if (hasModule("vitrine-telephone")) {
    storefrontItems.push({
      label: "Vitrine Téléphone",
      to: `/shop/${publicShopSlug}`,
      icon: Smartphone,
      search: { category: "phone" },
    });
  }
  if (hasModule("vitrine-pc")) {
    storefrontItems.push({
      label: "Vitrine PC",
      to: `/shop/${publicShopSlug}`,
      icon: Laptop,
      search: { category: "computer" },
    });
  }
  if (storefrontItems.length > 0) {
    groups.push({ label: "VITRINES", icon: Store, items: storefrontItems });
  }

  groups.push({
    label: "CLIENTS",
    icon: Users,
    items: [
      { label: "Clients", to: "/clients", icon: Users },
      { label: "Nouveau client", to: "/clients/nouveau", icon: UserPlus },
    ],
  });

  groups.push({
    label: "OUTILS",
    icon: Wrench,
    items: [
      { label: "Caisse", to: "/caisse", icon: Wallet },
      { label: "Catalogue", to: "/catalogue", icon: BookOpen },
    ],
  });

  if (role === "owner") {
    groups.push({
      label: "MON COMPTE",
      icon: Settings,
      items: isDemo
        ? [
            { label: "Équipe", to: "/equipe", icon: UserCog },
            { label: "Forfait", to: "/abonnement", icon: Settings },
            { label: "Paramètres", to: "/parametres", icon: Settings },
          ]
        : [
        { label: "Outils", to: "/outils", icon: Wrench },
        { label: "Catégories", to: "/categories", icon: FolderTree },
        { label: "Mes ateliers", to: "/boutiques", icon: Store },
        { label: "Équipe", to: "/equipe", icon: UserCog },
        { label: "Aide", to: "/aide", icon: CircleHelp },
        { label: "Profil", to: "/profil", icon: User },
        { label: "Forfait", to: "/abonnement", icon: Settings },
        { label: "Mes domaines", to: "/parametres", icon: Package },
        { label: "Paramètres", to: "/parametres", icon: Settings },
      ],
    });
  }

  if (!isDemo && (hasModule("vitrine-telephone") || hasModule("vitrine-pc"))) {
    groups.push({
      label: "MA BOUTIQUE",
      icon: Store,
      items: [
        { label: "Configuration", to: "/admin/boutique", icon: Store },
        { label: "Produits", to: "/admin/boutique/produits", icon: Package },
        { label: "Commandes", to: "/admin/boutique/commandes", icon: ShoppingCart },
      ],
    });
  }

  return groups;
}

/** Navigation principale de l'espace de travail. */
export function Sidebar({ mobileTrigger }: { mobileTrigger?: ReactNode } = {}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routeSearch = useRouterState({ select: (state) => state.location.search });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { activeModules, loading: modulesLoading, isDemo: demo } = useActiveModules();
  const { shop } = useCurrentShop();
  const { role, isSuperAdminAccount, viewMode, setViewMode } = useUserRole();
  const { roles, activeRole, setActiveRole } = useUserRoles();
  const pendingItems = usePendingItems(activeRole);
  const vocabulary = useSectorVocabulary();
  const navigationGroups = getNavigationGroups(
    activeModules,
    demo,
    shop?.shop_slug ?? null,
    Boolean(shop?.id),
    vocabulary,
    activeRole || role,
  );
  const pendingCountFor = (to: string) => {
    if (activeRole === "caissier" || activeRole === "owner") {
      if (to === "/caisse") return pendingItems.pendingCaisse;
    }
    if (activeRole === "receptionniste" || activeRole === "owner") {
      if (to === "/reception") return pendingItems.pendingReception;
    }
    if (activeRole === "technicien" || activeRole === "owner") {
      if (to.includes("/atelier") || to.includes("/historique") || to.includes("/carnet")) {
        return pendingItems.pendingReparation;
      }
    }
    if (activeRole === "vendeur" || activeRole === "owner") {
      if (to.startsWith("/sales")) return pendingItems.pendingVentes;
    }
    return 0;
  };
  const activeGroup = navigationGroups.findIndex((group) =>
    group.items.some(
      (item) =>
        (pathname === item.to || pathname.startsWith(`${item.to}/`)) &&
        (!item.search ||
          (!item.search.activityType ||
            (routeSearch as { activityType?: string }).activityType === item.search.activityType) &&
          (!item.search.category ||
            (routeSearch as { category?: string }).category === item.search.category)),
    ),
  );
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ [activeGroup]: true });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (activeGroup < 0) return;
    setOpenGroups({ [activeGroup]: true });
  }, [activeGroup]);

  async function handleSignOut() {
    if (demo) {
      endDemo();
      toast.success("La session de démonstration a été fermée.");
      await navigate({ to: "/" });
      return;
    }
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
    <nav
      className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-2"
      aria-label="Navigation principale"
    >
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
                  key={`${to}-${itemLabel}-${itemSearch?.category ?? itemSearch?.activityType ?? ""}`}
                  to={to}
                  search={itemSearch ?? {}}
                  onClick={() => setOpen(false)}
                  title={itemLabel}
                  className={cn(
                    "flex h-10 items-center gap-3 border-l-4 border-transparent px-3 py-2 pl-7 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-sidebar-foreground/65 dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center border-l-0 px-0",
                    pathname === to &&
                      "border-orange-500 bg-orange-50 font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-200",
                    pendingCountFor(to) > 0 && "animate-pulse",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      pathname === to ? "text-orange-600" : "text-slate-500",
                    )}
                  />
                  {!collapsed ? <span className="min-w-0 flex-1 truncate">{itemLabel}</span> : null}
                  {pendingCountFor(to) > 0 && !collapsed ? (
                    <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{pendingCountFor(to)}</span>
                  ) : null}
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

  const roleSwitchButton = isSuperAdminAccount ? (
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        const nextMode = viewMode === "admin" ? "shop" : "admin";
        setViewMode(nextMode);
        void navigate({ to: nextMode === "admin" ? "/admin" : "/dashboard" });
      }}
      title={viewMode === "admin" ? "Voir mon atelier" : "Mode admin"}
      className={cn("mb-2 w-full justify-start gap-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent", collapsed && "justify-center px-0")}
    >
      {viewMode === "admin" ? <Store className="size-4" /> : <Settings className="size-4" />}
      {!collapsed ? (viewMode === "admin" ? "Voir mon atelier" : "Mode admin") : null}
    </Button>
  ) : roles.length > 1 ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn("mb-2 w-full justify-start gap-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent", collapsed && "justify-center px-0")}
        >
          <UserCog className="size-4" />
          {!collapsed ? (
            <>
              <span className="truncate">{activeRole}</span>
              <ChevronDown className="ml-auto size-4" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {roles.map((item) => {
          const labelMap: Record<string, string> = {
            owner: "Chef d'atelier",
            technicien: "Technicien",
            caissier: "Caissier",
            magasinier: "Magasinier",
            receptionniste: "Réceptionniste",
            vendeur: "Vendeur",
          };
          const routeMap: Record<string, string> = {
            owner: "/dashboard",
            technicien: "/dashboard",
            caissier: "/caisse",
            magasinier: "/magasin",
            receptionniste: "/reception",
            vendeur: "/sales",
          };
          return (
            <DropdownMenuItem
              key={item}
              onSelect={() => {
                setActiveRole(item);
                void navigate({ to: routeMap[item] ?? "/dashboard" });
              }}
              className={cn(item === activeRole && "bg-orange-50 text-orange-700")}
            >
              <span className="flex-1">{labelMap[item] ?? item}</span>
              {item === activeRole ? <span className="size-2 rounded-full bg-orange-500" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

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
              placeholder="Rechercher un domaine..."
              aria-label="Rechercher dans le menu"
              className="h-9 border-sidebar-border bg-sidebar-accent pl-3 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        ) : null}
        {modulesLoading ? <Skeleton className="min-h-0 flex-1 w-full" /> : links}
        <div className="mt-4 shrink-0 border-t border-sidebar-border pt-4">{roleSwitchButton}{signOutButton}</div>
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
                placeholder="Rechercher un domaine..."
                aria-label="Rechercher dans le menu"
                className="h-9 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
            {modulesLoading ? <Skeleton className="min-h-0 flex-1 w-full" /> : links}
            <div className="mt-8 shrink-0 border-t border-sidebar-border pt-4">{roleSwitchButton}{signOutButton}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
