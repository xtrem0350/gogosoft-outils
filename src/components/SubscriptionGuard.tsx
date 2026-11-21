import {
  createContext,
  useContext,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useSubscription } from "@/hooks/useSubscription";
import { isDemoMode } from "@/services/demoService";
import { isSimulationMode } from "@/services/simulationService";
import type { SubscriptionSummary } from "@/services/subscriptionService";

interface SubscriptionAccess {
  subscription: SubscriptionSummary | null;
  isActive: boolean;
  isTrial: boolean;
  daysRemaining: number;
  isExpired: boolean;
  error: string | null;
  loading: boolean;
  isReadOnly: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionAccessContext = createContext<SubscriptionAccess | null>(null);

export function SubscriptionAccessProvider({
  children,
  enabled = true,
  userId,
}: {
  children: ReactNode;
  enabled?: boolean;
  userId?: string;
}) {
  const subscription = useSubscription({
    enabled,
    ...(userId ? { userId } : {}),
  });
  const value: SubscriptionAccess = {
    ...subscription,
    isReadOnly:
      enabled &&
      !subscription.loading &&
      (
        subscription.subscription?.status !== "active" ||
        subscription.isExpired ||
        Boolean(subscription.error)
      ),
  };
  return (
    <SubscriptionAccessContext.Provider value={value}>
      {children}
    </SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess(): SubscriptionAccess {
  const access = useContext(SubscriptionAccessContext);
  if (!access) {
    throw new Error("useSubscriptionAccess doit être utilisé dans SubscriptionAccessProvider.");
  }
  return access;
}

export function ReadOnlyGuard({ children }: { children: ReactNode }) {
  const { isReadOnly } = useSubscriptionAccess();
  if (!isReadOnly) return <>{children}</>;

  function blockAction(event: SyntheticEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      !target.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"]',
      )
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    toast.error("Abonnement expiré. Contactez l'administrateur.");
  }

  function blockSubmit(event: SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    toast.error("Abonnement expiré. Contactez l'administrateur.");
  }

  function blockKeyboardAction(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    blockAction(event);
  }

  return (
    <div
      aria-disabled="true"
      className="contents"
      onClickCapture={blockAction}
      onKeyDownCapture={blockKeyboardAction}
      onSubmitCapture={blockSubmit}
    >
      {children}
    </div>
  );
}

export function SubscriptionStatusNotice() {
  const location = useLocation();
  const {
    subscription,
    daysRemaining,
    isActive,
    isExpired,
    loading,
    error,
  } = useSubscriptionAccess();

  if (
    loading ||
    isDemoMode() ||
    isSimulationMode() ||
    location.pathname === "/abonnement" ||
    (!isExpired && (!isActive || daysRemaining >= 7))
  ) {
    if (error && !loading && !isDemoMode() && !isSimulationMode()) {
      return (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Impossible de vérifier l&apos;abonnement : {error}
        </p>
      );
    }
    return null;
  }

  if (isExpired) {
    const expiry = subscription?.expires_at
      ? new Date(subscription.expires_at).toLocaleDateString("fr-FR")
      : "la date indiquée";
    return (
      <div
        role="alert"
        className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"
      >
        Votre abonnement a expiré le {expiry}. Contactez l&apos;administrateur pour renouveler.
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900"
    >
      Votre abonnement expire dans {daysRemaining} jour{daysRemaining === 1 ? "" : "s"}.
      Pensez à renouveler.
    </div>
  );
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, isExpired, loading, error, refresh } = useSubscriptionAccess();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const demo = isDemoMode();
  const simulation = isSimulationMode();

  useEffect(() => {
    if (simulation || location.pathname !== "/dashboard" || shopLoading || shopId || demo) return;
    toast.info("Créez votre boutique pour continuer.");
    void navigate({ to: "/boutiques/nouveau" });
  }, [demo, location.pathname, navigate, shopId, shopLoading, simulation]);

  if (simulation || location.pathname === "/abonnement" || demo) return <>{children}</>;

  if (location.pathname === "/dashboard" && (shopLoading || !shopId)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Vérification de la boutique…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Vérification de l&apos;abonnement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="text-sm text-destructive">
          Impossible de vérifier l&apos;abonnement : {error}
        </p>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (isExpired) {
    return <ReadOnlyGuard>{children}</ReadOnlyGuard>;
  }

  if (!isActive && !isExpired) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-6">
        <Card className="w-full border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-destructive">
                Abonnement
              </p>
              <h1 className="mt-3 text-3xl font-bold">Votre abonnement n&apos;est pas actif</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Réactivez votre accès pour continuer à gérer votre atelier et vos clients.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => void navigate({ to: "/abonnement", search: { activate: undefined } })}
            >
              Renouveler
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
