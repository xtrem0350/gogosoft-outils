import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  Home,
  LogOut,
  Package,
  ShoppingCart,
  UserCog,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import logo from "@/assets/images/leprofile.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getRoleLabel, useUserRoles } from "@/hooks/useUserRoles";
import { signOut } from "@/services/authService";
import { endDemo, isDemoMode } from "@/services/demoService";

type MobileNavigationItem = {
  label: string;
  to: string;
  icon: typeof Home;
  search?: { tab: "rangements" };
};

const navigationByRole: Record<string, MobileNavigationItem[]> = {
  owner: [
    { label: "Accueil", to: "/dashboard", icon: Home },
    { label: "Documents", to: "/documents", icon: FileText },
    { label: "Profil", to: "/profil", icon: UserRound },
  ],
  receptionniste: [
    { label: "Réception", to: "/reception", icon: Home },
    { label: "Clients", to: "/clients", icon: Users },
    { label: "Catalogue", to: "/catalogue", icon: BookOpen },
    { label: "Rangements", to: "/parametres", search: { tab: "rangements" }, icon: Package },
  ],
  magasinier: [
    { label: "Magasin", to: "/magasin", icon: Package },
    { label: "Rangements", to: "/parametres", search: { tab: "rangements" }, icon: Package },
  ],
  caissier: [
    { label: "Caisse", to: "/caisse", icon: Wallet },
    { label: "Documents", to: "/documents", icon: FileText },
    { label: "Profil", to: "/profil", icon: UserRound },
  ],
  technicien: [
    { label: "Atelier", to: "/phone/atelier", icon: Wrench },
    { label: "Documents", to: "/documents", icon: FileText },
    { label: "Profil", to: "/profil", icon: UserRound },
  ],
  vendeur: [
    { label: "Ventes", to: "/sales", icon: ShoppingCart },
    { label: "Catalogue", to: "/catalogue", icon: BookOpen },
    { label: "Profil", to: "/profil", icon: UserRound },
  ],
};

const SWITCHABLE_OWNER_ROLES = [
  "owner",
  "receptionniste",
  "caissier",
  "technicien",
  "magasinier",
  "vendeur",
];
const ROLE_ROUTE_MAP: Record<string, string> = {
  owner: "/dashboard",
  receptionniste: "/reception",
  caissier: "/caisse",
  technicien: "/phone/atelier",
  magasinier: "/magasin",
  vendeur: "/sales",
};

export function MobileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { shop } = useCurrentShop();
  const { roles, activeRole, setActiveRole, isOwner } = useUserRoles();
  const [loggingOut, setLoggingOut] = useState(false);

  // CORRECTION ICI : accès via crochets pour respecter l'index signature TypeScript
  const mobileNavigationItems = navigationByRole[activeRole] ?? navigationByRole["owner"]!;
  const availableRoles = isOwner ? SWITCHABLE_OWNER_ROLES : roles;

  function switchRole(role: string) {
    setActiveRole(role);
    void navigate({ to: ROLE_ROUTE_MAP[role] ?? "/dashboard" });
  }

  async function handleSignOut() {
    setLoggingOut(true);
    try {
      if (isDemoMode()) {
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
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{shop?.name ?? "GogoSoft"}</p>
            <p className="truncate text-xs text-muted-foreground">Tools Manager</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {availableRoles.length > 1 || isOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Changer de rôle"
                  className="max-w-32 gap-1 px-2"
                >
                  <UserCog className="size-4 shrink-0" />
                  <span className="truncate text-xs">{getRoleLabel(activeRole)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableRoles.map((role) => (
                  <DropdownMenuItem key={role} onSelect={() => switchRole(role)}>
                    <span className="flex-1">{getRoleLabel(role)}</span>
                    {role === activeRole ? <span className="size-2 rounded-full bg-orange-500" /> : null}
                  </DropdownMenuItem>
                ))}
                {isOwner ? (
                  <DropdownMenuItem onSelect={() => void navigate({ to: "/atelier/plan" })}>
                    Plan de l&apos;atelier
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Déconnexion"
            title="Déconnexion"
            disabled={loggingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-20">{children}</main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 justify-around border-t bg-background"
      >
        {mobileNavigationItems.map(({ label, to, icon: Icon, search }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={`${to}-${label}`}
              to={to}
              search={search ?? {}}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-20 flex-col items-center justify-center gap-1 text-xs font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}