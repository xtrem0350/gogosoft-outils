import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Laptop,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getPageIcon } from "@/components/PageIdentity";
import { HelpButton } from "@/components/HelpButton";
import { InactivityWarningModal } from "@/components/InactivityWarningModal";
import { PricingModal } from "@/components/PricingModal";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { Sidebar } from "@/components/Sidebar";
import { ShopSelector } from "@/components/ShopSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { hasNewVersion } from "@/lib/changelog";
import { savePendingModuleSelection } from "@/services/moduleService";
import headerLogo from "@/assets/images/leprofile.png";

/** Layout unique de l'application. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [pricingPromptOpen, setPricingPromptOpen] = useState(false);
  const [quickCreateClientOpen, setQuickCreateClientOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, isSuperAdmin } = useAuth();
  const { shopId, shops, loading: shopLoading } = useCurrentShop();
  useEffect(() => {
    pageScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  const isAuthRoute = ["/auth", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"].includes(
    location.pathname,
  );
  useEffect(() => {
    if (authLoading || user || location.pathname !== "/") return;
    if (window.localStorage.getItem("gogosoft_pricing_shown")) return;

    const timeout = window.setTimeout(() => {
      setPricingPromptOpen(true);
      window.localStorage.setItem("gogosoft_pricing_shown", "true");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [authLoading, location.pathname, user]);
  useEffect(() => {
    setShowNewBadge(Boolean(user && !isAuthRoute && hasNewVersion()));
  }, [isAuthRoute, user?.id]);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isShopExemptRoute =
    isSuperAdmin ||
    isAdminRoute ||
    location.pathname.startsWith("/boutiques") ||
    location.pathname === "/abonnement" ||
    location.pathname === "/parametres";
  const isExemptRoute = isAuthRoute || location.pathname === "/abonnement" || isSuperAdmin;
  const loading = authLoading || (!isAuthRoute && !isSuperAdmin && shopLoading);
  const pageTitles: Record<string, string> = {
    "/": "🏠 Tableau de bord",
    "/atelier": "📋 Fiches d'atelier",
    "/atelier/plan": "🗄️ Plan de mon atelier",
    "/atelier/nouveau": "➕ Nouvelle fiche",
    "/phone/atelier": "📋 Fiches téléphone",
    "/phone/atelier/nouveau": "➕ Nouvelle réparation téléphone",
    "/phone/carnet": "📖 Carnet d'expérience téléphone",
    "/phone/historique": "🕘 Historique téléphone",
    "/computer/atelier": "💻 Fiches ordinateur",
    "/computer/atelier/nouveau": "➕ Nouvelle réparation PC",
    "/computer/carnet": "📖 Carnet d'expérience ordinateur",
    "/computer/historique": "🕘 Historique ordinateur",
    "/consumable/stock": "📦 Stock consommables",
    "/consumable/stock/nouveau": "➕ Ajouter un consommable",
    "/consumable/historique": "🕘 Historique consommables",
    "/sales": "🛒 Ventes",
    "/sales/nouveau": "➕ Nouvelle vente",
    "/sales/commandes": "📦 Commandes",
    "/salles/commandes": "📦 Commandes",
    "/sales/livraisons": "🚚 Livraisons",
    "/clients": "👥 Mes clients",
    "/clients/nouveau": "➕ Nouveau client",
    "/outils": "🛠️ Mes outils",
    "/categories": "Catégories",
    "/historique": "🕘 Historique",
    "/statistiques": "📊 Statistiques",
    "/equipe": "👥 Équipe",
    "/boutiques": "🏪 Mes ateliers",
    "/profil": "👤 Mon profil",
    "/abonnement": "💳 Mon abonnement",
    "/aide": "📚 Centre d'aide",
    "/parametres": "⚙️ Paramètres",
    "/parametres/emplacements": "📦 Mes emplacements",
    "/nouveautes": "✨ Nouveautés",
  };
  const routeTitle =
    pageTitles[location.pathname] ??
    Object.entries(pageTitles)
      .filter(([route]) => route !== "/" && location.pathname.startsWith(`${route}/`))
      .sort(([first], [second]) => second.length - first.length)[0]?.[1] ??
    "GogoSoft Tools Manager";
  const CurrentPageIcon = getPageIcon(location.pathname);
  const breadcrumbLabels: Record<string, string> = {
    "/": "Accueil",
    "/atelier": "Atelier",
    "/phone/atelier": "Téléphone",
    "/computer/atelier": "Ordinateur",
    "/consumable/stock": "Consommables",
    "/sales": "Ventes",
    "/clients": "Clients",
    "/boutiques": "Ateliers",
    "/outils": "Outils",
    "/categories": "Catégories",
    "/historique": "Historique",
    "/statistiques": "Stats",
    "/equipe": "Techniciens",
    "/abonnement": "Forfait",
    "/aide": "Aide",
    "/profil": "Profil",
    "/parametres": "Paramètres",
    "/admin": "Espace Admin",
    "/nouveautes": "Nouveautés",
  };
  const breadcrumbLabel = breadcrumbLabels[location.pathname] ?? pageTitles[location.pathname];

  const { showWarning, dismissWarning, timeRemaining, logoutNow } = useInactivityLogout({
    enabled: Boolean(user && !isAuthRoute),
  });

  if (!loading && !user && !isAuthRoute) {
    if (location.pathname === "/") {
      return (
        <>
          <LoadingShell />
          <PricingModal
            open={pricingPromptOpen}
            onOpenChange={(open) => {
              setPricingPromptOpen(open);
              if (!open) void navigate({ to: "/auth" });
            }}
            onCreateAccount={(selection) => {
              savePendingModuleSelection(selection);
              void navigate({ to: "/auth" });
            }}
          />
        </>
      );
    }
    void navigate({ to: "/auth", search: { redirect: location.pathname } });
    return <LoadingShell />;
  }

  if (!loading && user && !shopId && !isShopExemptRoute) {
    void navigate({ to: shops.length > 0 ? "/boutiques" : "/boutiques/nouveau" });
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
    <div className="flex h-screen overflow-hidden bg-background">
      {isSuperAdmin ? <AdminSidebar /> : <Sidebar />}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground shadow-lg sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              {isSuperAdmin ? <AdminSidebar
                mobileTrigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex size-10 items-center justify-center text-orange-600"
                    aria-label="Ouvrir le menu administrateur"
                  >
                    <Menu />
                  </Button>
                }
              /> : <Sidebar
                mobileTrigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-orange-50"
                    aria-label="Ouvrir le menu"
                  >
                    <Menu />
                  </Button>
                }
              />}
            </div>
            <img
              loading="lazy"
              decoding="async"
              src={headerLogo}
              alt="GogoSoft"
              className="size-10 rounded-xl object-cover"
            />
            <CurrentPageIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-orange-500 xl:hidden"
            />
            <h1 className="truncate font-display text-base font-semibold text-sidebar-foreground sm:text-lg">
              {isSuperAdmin ? "GogoSoft Admin" : "GogoSoft Tools Manager"}
            </h1>
            {showNewBadge ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setWhatsNewOpen(true)}
                className="shrink-0 gap-1 rounded-full bg-orange-100 px-3 text-xs font-semibold text-orange-800 hover:bg-orange-200"
              >
                <Sparkles className="size-3.5" /> Nouveau
              </Button>
            ) : null}
          </div>

          <h2 className="hidden min-w-0 flex-1 items-center gap-2 truncate px-4 text-lg font-semibold text-sidebar-foreground xl:flex">
            <CurrentPageIcon aria-hidden="true" className="size-5 shrink-0 text-orange-500" />
            <span className="truncate">{routeTitle}</span>
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
              className="relative hidden size-10 items-center justify-center rounded-full transition-colors hover:bg-orange-50 sm:flex"
            >
              <Bell />
            </Button>
            {!isSuperAdmin ? <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    disabled={!shopId}
                    className="h-10 rounded-full bg-ivoirien px-4 font-semibold text-white shadow-3d transition-transform hover:bg-ivoirien-hover active:scale-95"
                  >
                    <Plus />
                    Nouveau
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setQuickCreateClientOpen(true)}>
                    <Users /> Nouveau client
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void navigate({ to: "/phone/atelier/nouveau" })}
                  >
                    <Smartphone /> Nouvelle fiche téléphone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void navigate({ to: "/computer/atelier/nouveau" })}
                  >
                    <Laptop /> Nouvelle fiche ordinateur
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void navigate({ to: "/sales/nouveau" })}>
                    <ShoppingCart /> Nouvelle vente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> : null}
            {!isSuperAdmin ? <ShopSelector /> : null}
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <div
          ref={pageScrollRef}
          className="animate-fadeIn min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8"
        >
          {breadcrumbLabel ? (
            <Breadcrumb className="mb-4 animate-in slide-in-from-left-4 fade-in duration-300">
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
          <footer className="mt-8 hidden border-t border-border px-5 py-4 text-xs text-muted-foreground lg:block lg:px-8">
            Développé par Thierry Gogo &amp; Co
          </footer>
        </div>
      </main>
      {showWarning ? (
        <InactivityWarningModal
          open={showWarning}
          timeRemaining={timeRemaining}
          onStayLoggedIn={dismissWarning}
          onLogoutNow={logoutNow}
        />
      ) : null}
      <HelpButton />
      <WhatsNewModal
        open={whatsNewOpen}
        enabled={Boolean(user && !isAuthRoute)}
        onOpenChange={setWhatsNewOpen}
        onRead={() => setShowNewBadge(false)}
      />
      <QuickCreateClientDialog
        open={quickCreateClientOpen}
        onOpenChange={setQuickCreateClientOpen}
        shopId={shopId ?? ""}
        onCreated={(client) => {
          void navigate({ to: "/clients/$id", params: { id: client.id } });
        }}
      />
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
