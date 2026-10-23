import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Laptop,
  Menu,
  Monitor,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getPageIcon } from "@/components/PageIdentity";
import { HelpButton } from "@/components/HelpButton";
import { InactivityWarningModal } from "@/components/InactivityWarningModal";
import { DemoBanner } from "@/components/DemoBanner";
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
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useSectorVocabulary } from "@/hooks/useSectorVocabulary";
import { hasNewVersion } from "@/lib/changelog";
import {
  endDemo,
  getDemoInfo,
  hasDemoExpiredNotice,
  isDemoMode,
  readDemoSession,
} from "@/services/demoService";
import { savePendingModuleSelection } from "@/services/moduleService";
import headerLogo from "@/assets/images/leprofile.png";

function requiredRoles(pathname: string): UserRole[] | null {
  if (pathname.startsWith("/admin")) return ["super_admin"];
  if (pathname.startsWith("/caisse")) return ["owner", "caissier"];
  if (pathname.startsWith("/sales")) return ["owner", "vendeur"];
  if (pathname.startsWith("/equipe") || pathname.startsWith("/parametres") || pathname.startsWith("/abonnement")) {
    return ["owner"];
  }
  if (
    pathname === "/phone/atelier/nouveau" ||
    pathname === "/computer/atelier/nouveau"
  ) return ["owner", "technicien", "receptionniste"];
  if (pathname.startsWith("/phone/atelier") || pathname.startsWith("/phone/historique") || pathname.startsWith("/phone/carnet") || pathname.startsWith("/computer/atelier") || pathname.startsWith("/computer/historique") || pathname.startsWith("/computer/carnet")) {
    return ["owner", "technicien"];
  }
  if (pathname.startsWith("/consumable/stock")) return ["owner", "magasinier"];
  if (pathname.startsWith("/clients")) return ["owner", "technicien", "caissier", "magasinier", "receptionniste", "vendeur"];
  if (pathname.startsWith("/catalogue")) return ["owner", "technicien", "caissier", "magasinier", "receptionniste", "vendeur"];
  return null;
}

/** Layout unique de l'application. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [pricingPromptOpen, setPricingPromptOpen] = useState(false);
  const [quickCreateClientOpen, setQuickCreateClientOpen] = useState(false);
  const [demoInfo, setDemoInfo] = useState<Awaited<ReturnType<typeof getDemoInfo>>>(() => {
    const session = readDemoSession();
    return session ? { is_demo: true, demo_expires_at: session.expires_at } : null;
  });
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { isSuperAdmin, role, loading: roleLoading } = useUserRole();
  const { shopId, shops, loading: shopLoading } = useCurrentShop();
  const { activeModules } = useActiveModules();
  const sectorVocabulary = useSectorVocabulary();
  const userId = user?.id;
  useEffect(() => {
    let active = true;
    if (!userId) {
      const session = readDemoSession();
      setDemoInfo(session ? { is_demo: true, demo_expires_at: session.expires_at } : null);
      return () => {
        active = false;
      };
    }
    void getDemoInfo()
      .then((info) => {
        if (active) setDemoInfo(info?.is_demo === true ? info : null);
      })
      .catch(() => {
        if (active) setDemoInfo(null);
      });
    return () => {
      active = false;
    };
  }, [userId]);
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
    setShowNewBadge(Boolean(userId && !isAuthRoute && hasNewVersion()));
  }, [isAuthRoute, userId]);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isShopExemptRoute =
    isSuperAdmin ||
    isAdminRoute ||
    location.pathname.startsWith("/boutiques") ||
    location.pathname === "/abonnement" ||
    location.pathname === "/parametres";
  const isExemptRoute =
    isAuthRoute || location.pathname === "/abonnement" || isSuperAdmin || isDemoMode();
  const loading = authLoading || roleLoading || (!isAuthRoute && !isSuperAdmin && shopLoading);
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
    "/personnel": "👥 Personnel",
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
    "/personnel": "Personnel",
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
  const createOptions = [
    {
      id: "reparation-telephone",
      icon: Smartphone,
      label:
        sectorVocabulary.moduleId === "reparation-telephone"
          ? `Nouvelle ${sectorVocabulary.order.toLowerCase()} téléphone`
          : "Nouvelle fiche de réparation téléphone",
      to: "/phone/atelier/nouveau" as const,
    },
    {
      id: "reparation-pc",
      icon: Laptop,
      label:
        sectorVocabulary.moduleId === "reparation-pc"
          ? `Nouvelle ${sectorVocabulary.order.toLowerCase()} PC`
          : "Nouvelle fiche de réparation PC",
      to: "/computer/atelier/nouveau" as const,
    },
    {
      id: "vente-telephone",
      icon: ShoppingCart,
      label:
        sectorVocabulary.moduleId === "vente-telephone"
          ? `Nouvelle ${sectorVocabulary.order.toLowerCase()} téléphone`
          : "Nouvelle vente téléphone",
      to: "/sales/nouveau" as const,
    },
    {
      id: "vente-pc",
      icon: ShoppingCart,
      label:
        sectorVocabulary.moduleId === "vente-pc"
          ? `Nouvelle ${sectorVocabulary.order.toLowerCase()} PC`
          : "Nouvelle vente PC",
      to: "/sales/nouveau" as const,
    },
    {
      id: "consommables",
      icon: Package,
      label: "Nouvel article consommable",
      to: "/consumable/stock/nouveau" as const,
    },
    {
      id: "vitrine-telephone",
      icon: Monitor,
      label: "Nouveau produit vitrine",
      to: "/admin/boutique/produits/nouveau" as const,
    },
    {
      id: "vitrine-pc",
      icon: Monitor,
      label: "Nouveau produit vitrine",
      to: "/admin/boutique/produits/nouveau" as const,
    },
  ].filter((option) => {
    const moduleIsActive = activeModules.some((activeModule) => activeModule === option.id);
    if (!moduleIsActive) return false;
    if (option.id.startsWith("reparation-telephone") || option.id.startsWith("reparation-pc")) {
      return role === "owner" || role === "technicien" || role === "receptionniste";
    }
    if (option.id.startsWith("vente-")) return role === "owner" || role === "vendeur";
    if (option.id === "consommables") return role === "owner" || role === "magasinier";
    return role === "owner";
  });
  const canCreateClientFromHeader = role === "owner" || role === "receptionniste";

  const { showWarning, dismissWarning, timeRemaining, logoutNow } = useInactivityLogout({
    enabled: Boolean(user && !isAuthRoute),
  });

  const mustLeaveSignedOut =
    !loading && !user && !isAuthRoute && !isDemoMode() && location.pathname !== "/";
  const mustPickShop = !loading && Boolean(user) && !shopId && !isShopExemptRoute;

  // Les redirections se font après le rendu (jamais pendant), pour éviter les mises à jour React en cours de rendu.
  useEffect(() => {
    if (mustLeaveSignedOut) {
      if (hasDemoExpiredNotice()) {
        void navigate({ to: "/" });
      } else {
        void navigate({ to: "/auth", search: { redirect: location.pathname } });
      }
      return;
    }
    if (mustPickShop) {
      void navigate({ to: shops.length > 0 ? "/boutiques" : "/boutiques/nouveau" });
    }
  }, [location.pathname, mustLeaveSignedOut, mustPickShop, navigate, shops.length]);

  if (!loading && !user && !isAuthRoute && !isDemoMode()) {
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
              void navigate({ to: "/auth", search: { mode: "signup" } });
            }}
          />
        </>
      );
    }
    return <LoadingShell />;
  }

  if (mustPickShop) {
    return <LoadingShell />;
  }

  if (loading) return <LoadingShell />;

  const baseContent = isExemptRoute ? (
    <>{children}</>
  ) : (
    <ProtectedRoute>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProtectedRoute>
  );
  const allowedRoles = requiredRoles(location.pathname);
  const content = allowedRoles ? (
    <RoleGuard allowedRoles={allowedRoles}>{baseContent}</RoleGuard>
  ) : baseContent;

  return (
    <>
      {demoInfo?.is_demo === true ? (
        <DemoBanner
          expiresAt={demoInfo.demo_expires_at}
          onCreateAccount={() => {
            endDemo();
            void navigate({ to: "/auth" });
          }}
        />
      ) : null}
      <div
        className={`flex h-screen overflow-hidden bg-background ${
          demoInfo?.is_demo === true ? "pt-10" : ""
        }`}
      >
      {isSuperAdmin ? <AdminSidebar /> : <Sidebar />}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground shadow-lg sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              {isSuperAdmin ? (
                <AdminSidebar
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
                />
              ) : (
                <Sidebar
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
                />
              )}
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
            {!isSuperAdmin && (canCreateClientFromHeader || createOptions.length > 0) ? (
              <div className="hidden sm:block">
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
                    {canCreateClientFromHeader ? (
                      <DropdownMenuItem onSelect={() => setQuickCreateClientOpen(true)}>
                        <Users /> Nouveau client
                      </DropdownMenuItem>
                    ) : null}
                    {createOptions.map(({ id, icon: Icon, label, to }) => (
                      <DropdownMenuItem key={id} onSelect={() => void navigate({ to })}>
                        <Icon /> {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
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
                    <Link to="/dashboard">Accueil</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {location.pathname !== "/dashboard" ? <BreadcrumbSeparator /> : null}
                {location.pathname !== "/dashboard" ? (
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
    </>
  );
}

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Chargement...
    </div>
  );
}
