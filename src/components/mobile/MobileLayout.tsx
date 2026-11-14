import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { FileText, Home, LogOut, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import logo from "@/assets/images/leprofile.png";
import { Button } from "@/components/ui/button";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { signOut } from "@/services/authService";
import { endDemo, isDemoMode } from "@/services/demoService";

const navigationItems = [
  { label: "Accueil", to: "/dashboard" as const, icon: Home },
  { label: "Documents", to: "/documents" as const, icon: FileText },
  { label: "Profil", to: "/profil" as const, icon: UserRound },
];

export function MobileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { shop } = useCurrentShop();
  const [loggingOut, setLoggingOut] = useState(false);

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
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-20">{children}</main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 justify-around border-t bg-background"
      >
        {navigationItems.map(({ label, to, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
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
