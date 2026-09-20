import { BarChart3, FolderTree, Hammer, History, LayoutDashboard, LogOut, Settings, User, Users, Wrench } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/services/authService";

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Outils", to: "/outils", icon: Wrench },
  { label: "Catégories", to: "/categories", icon: FolderTree },
  { label: "Historique", to: "/historique", icon: History },
  { label: "Statistiques", to: "/statistiques", icon: BarChart3 },
  { label: "Équipe", to: "/equipe", icon: Users },
  { label: "Paramètres", to: "/parametres", icon: Settings },
  { label: "Profil", to: "/profil", icon: User },
  { label: "Atelier", to: "/atelier", icon: Hammer },
] as const;

/** Navigation principale de l'espace de travail. */
export function Sidebar({ mobileTrigger }: { mobileTrigger?: ReactNode } = {}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  async function handleSignOut() {
    const { error } = await signOut();
    if (error) { toast.error(error.message); return; }
    await navigate({ to: "/auth" });
  }
  const links = <nav className="space-y-1" aria-label="Navigation principale">
    {navigation.map(({ label, to, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === to && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm")}><Icon className="size-4" />{label}</Link>)}
  </nav>;
  const signOutButton = <button type="button" onClick={() => void handleSignOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><LogOut className="size-4" />Déconnexion</button>;
  return (
    <>
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
      <div className="mb-8 px-2"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">Espace de travail</p></div>
      {links}
      <div className="mt-auto border-t border-sidebar-border pt-4">{signOutButton}</div>
    </aside>
    {mobileTrigger ? <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild>{mobileTrigger}</SheetTrigger><SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground"><SheetTitle className="mb-8">Espace de travail</SheetTitle>{links}<div className="mt-8 border-t border-sidebar-border pt-4">{signOutButton}</div></SheetContent></Sheet> : null}
    </>
  );
}