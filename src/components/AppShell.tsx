import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHero } from "@/components/PageHero";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { Sidebar } from "@/components/Sidebar";
import { ShopSelector } from "@/components/ShopSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import logo from "@/assets/images/profile.png";

/** Layout unique de l'application. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const isAuthRoute = location.pathname === "/auth";
  const isShopExemptRoute =
    location.pathname.startsWith("/boutiques") ||
    location.pathname === "/abonnement" ||
    location.pathname === "/parametres";
  const isExemptRoute = isAuthRoute || location.pathname === "/abonnement";
  const loading = authLoading || (!isAuthRoute && shopLoading);
  const pageTitles: Record<string, string> = {
    "/": "Tableau de bord",
    "/atelier": "Fiches d'atelier",
    "/atelier/nouveau": "Nouvelle fiche",
    "/clients": "Clients",
    "/clients/nouveau": "Nouveau client",
    "/outils": "Outils",
    "/categories": "Catégories",
    "/historique": "Historique",
    "/statistiques": "Statistiques",
    "/equipe": "Équipe",
    "/boutiques": "Mes ateliers",
    "/profil": "Mon profil",
    "/abonnement": "Mon abonnement",
    "/parametres": "Paramètres",
  };
  const heroRoutes: Record<string, { title: string; subtitle?: string; imageUrl: string }> = {
    "/atelier": {
      title: "Mes réparations",
      subtitle: "Toutes vos fiches en cours et terminées",
      imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200",
    },
    "/atelier/nouveau": {
      title: "Nouvelle fiche",
      imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200",
    },
    "/clients": {
      title: "Mes clients",
      subtitle: "Tous vos clients enregistrés",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
    },
    "/clients/nouveau": {
      title: "Nouveau client",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
    },
    "/boutiques": {
      title: "Mes ateliers",
      subtitle: "Gérez vos points de vente",
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200",
    },
    "/boutiques/nouveau": {
      title: "Créer un atelier",
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200",
    },
    "/equipe": {
      title: "Mes techniciens",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
    },
    "/outils": {
      title: "Mes outils",
      subtitle: "Bibliothèque de logiciels de réparation",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    },
    "/categories": {
      title: "Catégories",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    },
    "/historique": {
      title: "Historique",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    },
    "/statistiques": {
      title: "Mes stats",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
    },
    "/abonnement": {
      title: "Mon forfait",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
    },
    "/parametres": {
      title: "Paramètres",
      imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200",
    },
    "/profil": {
      title: "Mon profil",
      imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=1200",
    },
  };
  const heroRoute =
    heroRoutes[location.pathname] ??
    Object.entries(heroRoutes).find(([route]) => location.pathname.startsWith(`${route}/`))?.[1];
  const breadcrumbLabels: Record<string, string> = {
    "/": "Accueil",
    "/atelier": "Atelier",
    "/clients": "Clients",
    "/boutiques": "Ateliers",
    "/outils": "Outils",
    "/categories": "Catégories",
    "/historique": "Historique",
    "/statistiques": "Stats",
    "/equipe": "Techniciens",
    "/abonnement": "Forfait",
    "/profil": "Profil",
    "/parametres": "Paramètres",
    "/admin": "Espace Admin",
  };
  const breadcrumbLabel = breadcrumbLabels[location.pathname] ?? pageTitles[location.pathname];

  if (!loading && !user && !isAuthRoute) {
    void navigate({ to: "/auth", search: { redirect: location.pathname } });
    return <LoadingShell />;
  }

  if (!loading && user && !shopId && !isShopExemptRoute) {
    void navigate({ to: "/boutiques/nouveau" });
    return <LoadingShell />;
  }

  if (loading) return <LoadingShell />;

  const content = isExemptRoute ? (
    <>{children}</>
  ) : (
    <ProtectedRoute>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProtectedRoute>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground shadow-lg sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Sidebar
                mobileTrigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    aria-label="Ouvrir le menu"
                  >
                    <Menu />
                  </Button>
                }
              />
            </div>
            <img
              loading="lazy"
              decoding="async"
              src={logo}
              alt="GogoSoft"
              className="size-10 rounded-xl object-cover"
            />
            <h1 className="truncate font-display text-base font-semibold text-sidebar-foreground sm:text-lg">
              GogoSoft Tools Manager
            </h1>
          </div>

          <h2 className="hidden min-w-0 flex-1 truncate px-4 text-lg font-semibold text-sidebar-foreground xl:block">
            {pageTitles[location.pathname] ?? "GogoSoft Tools Manager"}
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative hidden w-44 lg:block xl:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Rechercher"
                placeholder="Rechercher..."
                className="h-9 border-sidebar-border bg-sidebar-accent pl-9 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Bell />
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden bg-[#5b2c06] font-bold text-white shadow-3d transition-colors hover:bg-[#713807] sm:inline-flex"
            >
              <Link to="/atelier/nouveau">
                <Plus />
                Nouvelle fiche
              </Link>
            </Button>
            <ShopSelector />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <div className="animate-fadeIn flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
          {heroRoute && location.pathname !== "/admin" ? (
            <PageHero
              {...heroRoute}
              showBack={location.pathname !== "/atelier" && location.pathname !== "/clients"}
            />
          ) : null}
          {breadcrumbLabel ? (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Accueil</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {location.pathname !== "/" ? <BreadcrumbSeparator /> : null}
                {location.pathname !== "/" ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
          {content}
        </div>

        <footer className="hidden border-t border-border px-5 py-4 text-xs text-muted-foreground lg:block lg:px-8">
          Développé par Thierry Gogo &amp; Co
        </footer>
      </main>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Chargement...
    </div>
  );
}
