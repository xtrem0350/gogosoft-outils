import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/services/authService";

type NavigationItem = { label: string; to: string; icon: ComponentType<{ className?: string }> };
type NavigationGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Accueil",
    icon: LayoutDashboard,
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Mon atelier",
    icon: Wrench,
    items: [
      { label: "Fiches en cours", to: "/atelier", icon: ClipboardList },
      { label: "Nouvelle fiche", to: "/atelier/nouveau", icon: PlusCircle },
      { label: "Historique", to: "/historique", icon: History },
    ],
  },
  {
    label: "Mes clients",
    icon: Users,
    items: [
      { label: "Liste des clients", to: "/clients", icon: UserRound },
      { label: "Nouveau client", to: "/clients/nouveau", icon: UserPlus },
    ],
  },
  {
    label: "Mes ressources",
    icon: Package,
    items: [
      { label: "Outils", to: "/outils", icon: Wrench },
      { label: "Catégories", to: "/categories", icon: FolderTree },
      { label: "Équipe", to: "/equipe", icon: UserCog },
      { label: "Ateliers", to: "/boutiques", icon: Store },
    ],
  },
  {
    label: "Mon compte",
    icon: Settings,
    items: [
      { label: "Profil", to: "/profil", icon: User },
      { label: "Abonnement", to: "/abonnement", icon: CreditCard },
      { label: "Paramètres", to: "/parametres", icon: Settings },
    ],
  },
];

/** Navigation principale de l'espace de travail. */
export function Sidebar({ mobileTrigger }: { mobileTrigger?: ReactNode } = {}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const activeGroup = navigationGroups.findIndex((group) =>
    group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)),
  );
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ [activeGroup]: true });
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (activeGroup < 0) return;
    setOpenGroups((current) => ({ ...current, [activeGroup]: true }));
  }, [activeGroup]);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
      return;
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
            <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <GroupIcon className="size-4" />
              {!collapsed ? <span className="flex-1">{label}</span> : null}
              {!collapsed ? (
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              ) : null}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {filteredItems.map(({ label: itemLabel, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 border-l-4 border-transparent px-3 py-2.5 pl-7 text-sm text-sidebar-foreground/65 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    pathname === to &&
                      "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200",
                  )}
                >
                  <Icon className="size-4" />
                  {!collapsed ? itemLabel : null}
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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <LogOut className="size-4" />
      {!collapsed ? "Déconnexion" : null}
    </button>
  );

  const backButton = (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <ArrowLeft className="size-4" />
      {!collapsed ? "Retour" : null}
    </button>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-[width] lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-2 px-2">
          {!collapsed ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
              Espace de travail
            </p>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Afficher la sidebar" : "Masquer la sidebar"}
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
        {!collapsed ? (
          <div className="relative mb-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans le menu"
              className="h-9 border-sidebar-border bg-sidebar-accent pl-3 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        ) : null}
        {backButton}
        {links}
        <div className="mt-auto border-t border-sidebar-border pt-4">{signOutButton}</div>
      </aside>

      {mobileTrigger ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{mobileTrigger}</SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground">
            <SheetTitle className="mb-8">Espace de travail</SheetTitle>
            <div className="relative mb-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher dans le menu"
                className="h-9 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
            {backButton}
            {links}
            <div className="mt-8 border-t border-sidebar-border pt-4">{signOutButton}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
