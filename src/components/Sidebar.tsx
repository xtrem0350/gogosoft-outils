import {
  ArrowLeft,
  ChevronDown,
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
    label: "ACCUEIL",
    icon: Home,
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "TÉLÉPHONE",
    icon: Smartphone,
    items: [
      { label: "Fiches", to: "/phone/atelier", icon: Smartphone },
      { label: "Nouvelle fiche", to: "/phone/atelier/nouveau", icon: PlusCircle },
      { label: "Carnet d'expérience", to: "/phone/carnet", icon: History },
      { label: "Historique", to: "/phone/historique", icon: History },
    ],
  },
  {
    label: "ORDINATEUR",
    icon: Laptop,
    items: [
      { label: "Fiches", to: "/computer/atelier", icon: Laptop },
      { label: "Nouvelle fiche", to: "/computer/atelier/nouveau", icon: PlusCircle },
      { label: "Carnet d'expérience", to: "/computer/carnet", icon: History },
      { label: "Historique", to: "/computer/historique", icon: History },
    ],
  },
  {
    label: "CONSOMMABLES",
    icon: Package,
    items: [
      { label: "Stock", to: "/consumable/stock", icon: Package },
      { label: "Nouveau produit", to: "/consumable/stock/nouveau", icon: PlusCircle },
      { label: "Historique", to: "/consumable/historique", icon: History },
    ],
  },
  {
    label: "VENTES",
    icon: ShoppingCart,
    items: [
      { label: "Toutes les ventes", to: "/sales", icon: ShoppingCart },
      { label: "Nouvelle vente", to: "/sales/nouveau", icon: PlusCircle },
      { label: "Commandes", to: "/sales/commandes", icon: Package },
      { label: "Livraisons", to: "/sales/livraisons", icon: History },
    ],
  },
  {
    label: "CLIENTS",
    icon: Users,
    items: [
      { label: "Liste", to: "/clients", icon: UserRound },
      { label: "Nouveau", to: "/clients/nouveau", icon: UserPlus },
    ],
  },
  {
    label: "MES RESSOURCES",
    icon: Wrench,
    items: [
      { label: "Outils", to: "/outils", icon: Wrench },
      { label: "Catégories", to: "/categories", icon: FolderTree },
      { label: "Techniciens", to: "/equipe", icon: UserCog },
      { label: "Mes ateliers", to: "/boutiques", icon: Store },
    ],
  },
  {
    label: "MON COMPTE",
    icon: Settings,
    items: [
      { label: "Profil", to: "/profil", icon: User },
      { label: "Forfait", to: "/abonnement", icon: Settings },
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
            <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <GroupIcon className="size-4" />
              <span className="flex-1">{label}</span>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
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
                      "border-orange-500 bg-orange-50 font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-200",
                  )}
                >
                  <Icon className="size-4" />
                  {itemLabel}
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
      Déconnexion
    </button>
  );

  const backButton = (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour
    </button>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex",
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-2 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
            Espace de travail
          </p>
        </div>
        <div className="relative mb-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher..."
            aria-label="Rechercher dans le menu"
            className="h-9 border-sidebar-border bg-sidebar-accent pl-3 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>
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
