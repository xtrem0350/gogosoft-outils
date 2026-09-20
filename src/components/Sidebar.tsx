import { BarChart3, Boxes, ClipboardList, LayoutDashboard, Settings, Tags, UserRound, Users } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Outils", to: "/outils", icon: Boxes },
  { label: "Catégories", to: "/categories", icon: Tags },
  { label: "Historique", to: "/historique", icon: ClipboardList },
  { label: "Statistiques", to: "/statistiques", icon: BarChart3 },
  { label: "Équipe", to: "/equipe", icon: Users },
  { label: "Paramètres", to: "/parametres", icon: Settings },
  { label: "Profil", to: "/profil", icon: UserRound },
] as const;

/** Navigation principale de l'espace de travail. */
export function Sidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:block">
      <div className="mb-8 px-2"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">Espace de travail</p></div>
      <nav className="space-y-1" aria-label="Navigation principale">
        {navigation.map(({ label, to, icon: Icon }) => <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === to && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm")}><Icon className="size-4" />{label}</Link>)}
      </nav>
    </aside>
  );
}