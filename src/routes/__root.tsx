import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrentShopProvider } from "@/hooks/useCurrentShop";
import { Toaster } from "@/components/ui/sonner";

/** Ce fichier est le SEUL endroit où AppShell est monté. Ne jamais l'utiliser dans une route enfant. */

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error?: Error; reset?: () => void }) {
  console.error("[ErrorBoundary]", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-orange-100">
        <span className="text-3xl" role="img" aria-label="Alerte">
          ⚠️
        </span>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Une erreur est survenue</h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        {error?.message ?? "Une erreur inattendue s'est produite."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset?.();
          }}
          className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          Réessayer
        </button>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="rounded-lg border px-4 py-2 hover:bg-slate-50"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GogoSoft Tools Manager" },
      { name: "description", content: "GogoSoft Tools Manager" },
      { name: "author", content: "Thierry Gogo & Co" },
      { property: "og:title", content: "GogoSoft Tools Manager" },
      { property: "og:description", content: "GogoSoft Tools Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@gogosoft" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/profile.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const [isClient, setIsClient] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const alreadyShown = sessionStorage.getItem("gogosoft_splash_shown") === "true";
    if (alreadyShown) return;
    setShowSplash(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("gogosoft_splash_shown", "true");
      setShowSplash(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isClient || showSplash) {
    return showSplash ? (
      <SplashScreen />
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrentShopProvider>
          {isAuthPage ? (
            <Outlet />
          ) : (
            <AppShell>
              <Outlet />
            </AppShell>
          )}
        </CurrentShopProvider>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
