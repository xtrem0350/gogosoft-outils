import { useLocation, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { Sidebar } from "@/components/Sidebar";
import { ShopSelector } from "@/components/ShopSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import logo from "@/assets/images/logo.png";

/** Layout unique de l'application. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const isAuthRoute = location.pathname === "/auth";
  const isShopExemptRoute = location.pathname.startsWith("/boutiques") || location.pathname === "/abonnement" || location.pathname === "/parametres";
  const isExemptRoute = isAuthRoute || location.pathname === "/abonnement";
  const loading = authLoading || (!isAuthRoute && shopLoading);

  if (!loading && !user && !isAuthRoute) {
    void navigate({ to: "/auth", search: { redirect: location.pathname } });
    return <LoadingScreen />;
  }

  if (!loading && user && !shopId && !isShopExemptRoute) {
    void navigate({ to: "/boutiques/nouveau" });
    return <LoadingScreen />;
  }

  if (loading) return <LoadingScreen />;

  const content = isExemptRoute ? <>{children}</> : (
    <ProtectedRoute>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProtectedRoute>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="surface-gradient flex min-h-20 items-center justify-between gap-3 px-4 shadow-lg sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Sidebar
                mobileTrigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                    aria-label="Ouvrir le menu"
                  >
                    <Menu />
                  </Button>
                }
              />
            </div>
            <img src={logo} alt="GogoSoft" className="size-10 rounded-xl object-cover" />
            <h1 className="truncate font-display text-base font-semibold text-white sm:text-lg">
              GogoSoft Tools Manager
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ShopSelector />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">{content}</div>

        <footer className="hidden border-t border-border px-5 py-4 text-xs text-muted-foreground lg:block lg:px-8">
          Développé par Thierry Gogo &amp; Co
        </footer>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Chargement...</div>;
}