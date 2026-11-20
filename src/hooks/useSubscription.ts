import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { checkExpiration, type SubscriptionSummary } from "@/services/subscriptionService";
import {
  isSimulationMode,
  SIMULATION_CHANGED_EVENT,
} from "@/services/simulationService";

interface UseSubscriptionOptions {
  enabled?: boolean;
  userId?: string;
}

export function useSubscription({ enabled = true, userId }: UseSubscriptionOptions = {}) {
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSubscription(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (isSimulationMode()) {
      setSubscription(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await checkExpiration(userId);
      if (!isSimulationMode()) setSubscription(next);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Impossible de vérifier l'abonnement.";
      console.error("[useSubscription] Vérification impossible.", reason);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    const handleSimulationChanged = () => void refresh();
    window.addEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
    void refresh();

    if (!enabled || isSimulationMode()) {
      return () => {
        window.removeEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });

    return () => {
      window.removeEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
      authListener.subscription.unsubscribe();
    };
  }, [enabled, refresh]);

  const value = useMemo(() => {
    const expiresAt = subscription?.expires_at
      ? new Date(subscription.expires_at).getTime()
      : Number.NaN;
    const hasExpiry = Number.isFinite(expiresAt);
    const daysRemaining = hasExpiry
      ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;
    const isExpired =
      subscription?.status === "expired" || (hasExpiry && expiresAt <= Date.now());
    const isTrial = subscription?.status === "trial";
    const isActive =
      subscription?.status === "active"
        ? !hasExpiry || expiresAt > Date.now()
        : isTrial && hasExpiry && expiresAt > Date.now();

    return {
      subscription,
      isActive,
      isTrial,
      daysRemaining,
      isExpired,
      error,
      loading,
      refresh,
    };
  }, [error, loading, refresh, subscription]);

  return value;
}
