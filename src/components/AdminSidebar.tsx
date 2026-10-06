import {
  Bell,
  CircleHelp,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Shield,
  Store,
  User,
  Users,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "@/services/authService";

type AdminItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
};

type AdminGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: AdminItem[];
};

const groups: AdminGroup[] = [
  {
    label: "VUE D'ENSEMBLE",
    icon: LayoutDashboard,
    items: [{ label: "Dashboard plateforme", to: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "ABONNÉS",
    icon: Users,
    items: [
      { label: "Tous les abonnés", to: "/admin/tenants", icon: Users },
      { label: "Abonnés actifs", to: "/admin/tenants?status=active", icon: Users },
      { label: "Abonnés en retard", to: "/admin/tenants?status=late", icon: Users },
      { label: "Historique abonnements", to: "/admin/tenants/historique", icon: Users },
    ],
  },
  {
    label: "GESTION MODULES",
    icon: Package,
    items: [
      { label: "Modules disponibles", to: "/admin/modules", icon: Package },
      { label: "Ajouter un module à un abonné", to: "/admin/modules/ajouter", icon: Package },
      { label: "Modules gratuits", to: "/admin/modules?type=free", icon: Package },
      { label: "Nouveaux modules", to: "/admin/modules/nouveau", icon: Package },
    ],
  },
  {
    label: "MA BOUTIQUE",
    icon: Store,
    items: [
      { label: "Configuration", to: "/admin/boutique", icon: Store },
      { label: "Produits", to: "/admin/boutique/produits", icon: Package },
      { label: "Commandes", to: "/admin/boutique/commandes", icon: Package },
    ],
  },
  {
    label: "FINANCES",
    icon: DollarSign,
    items: [
      { label: "Tous les paiements", to: "/admin/paiements", icon: CreditCard },
      { label: "MRR / Revenus", to: "/admin/finances", icon: DollarSign },
      { label: "Configuration prix", to: "/admin/prix", icon: DollarSign },
      { label: "Facturation", to: "/admin/facturation", icon: CreditCard },
    ],
  },
  {
    label: "COMMUNICATION",
    icon: Bell,
    items: [
      { label: "Notifications globales", to: "/admin/notifications", icon: Bell },
      { label: "Messages aux abonnés", to: "/admin/messages", icon: MessageSquare },
      { label: "Annonces", to: "/admin/annonces", icon: Bell },
    ],
  },
  {
    label: "SUPPORT",
    icon: MessageSquare,
    items: [
      { label: "Tickets ouverts", to: "/admin/support", icon: MessageSquare },
      { label: "Messages", to: "/admin/support/messages", icon: MessageSquare },
      { label: "FAQ", to: "/admin/support/faq", icon: CircleHelp },
    ],
  },
  {
    label: "MON COMPTE",
    icon: Settings,
    items: [
      { label: "Profil", to: "/profil", icon: User },
      { label: "Aide", to: "/aide", icon: CircleHelp },
    ],
  },
];

export function AdminSidebar({ mobileTrigger }: { mobileTrigger?: ReactNode } = {}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    await navigate({ to: "/auth" });
  }

  const navigation = (
    <nav className="space-y-5" aria-label="Navigation Super Admin">
      {groups.map(({ label, icon: GroupIcon, items }) => (
        <section key={label}>
          <h2 className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold tracking-wide text-slate-400">
            <GroupIcon className="size-3.5 text-orange-400" />
            {label}
          </h2>
          <div className="space-y-1">
            {items.map(({ label: itemLabel, to, icon: Icon }) => {
              const href = to.split("?")[0] ?? to;
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={to}
                  to={href as any}
                  search={to.includes("?") ? (Object.fromEntries(new URLSearchParams(to.split("?")[1])) as any) : ({} as any)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-10 items-center gap-3 border-l-4 border-transparent px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
                    active && "border-orange-500 bg-orange-500/20 font-semibold text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">{itemLabel}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  const signOutButton = (
    <Button
      type="button"
      variant="ghost"
      onClick={() => void handleSignOut()}
      className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
    >
      <LogOut className="size-4" />
      Déconnexion
    </Button>
  );

  return (
    <>
      <aside className="hidden h-screen w-[272px] shrink-0 flex-col bg-slate-900 text-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-700 px-5">
          <Shield className="size-6 text-orange-400" />
          <span className="font-display text-sm font-bold">GOGOSOFT ADMIN</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">{navigation}</div>
        <div className="shrink-0 border-t border-slate-700 p-3">{signOutButton}</div>
      </aside>
      {mobileTrigger ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{mobileTrigger}</SheetTrigger>
          <SheetContent side="left" className="flex h-dvh w-80 flex-col border-slate-700 bg-slate-900 p-0 text-white">
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-700 px-5">
              <Shield className="size-6 text-orange-400" />
              <SheetTitle className="font-display text-sm font-bold text-white">GOGOSOFT ADMIN</SheetTitle>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">{navigation}</div>
            <div className="shrink-0 border-t border-slate-700 p-3">{signOutButton}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}