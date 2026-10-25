import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  getMySubscription,
  isSubscriptionActive,
  type SubscriptionSummary,
} from "@/services/subscriptionService";
import {
  isSimulationMode,
  SIMULATION_CHANGED_EVENT,
} from "@/services/simulationService";

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isSimulationMode()) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const next = await getMySubscription();
      if (isSimulationMode()) return;
      setSubscription(next);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleSimulationChanged = () => void refresh();
    window.addEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
    if (isSimulationMode()) {
      void refresh();
      return () => {
        window.removeEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
      };
    }

    void refresh();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });

    return () => {
      window.removeEventListener(SIMULATION_CHANGED_EVENT, handleSimulationChanged);
      authListener.subscription.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      subscription,
      isActive: isSubscriptionActive(subscription),
      daysRemaining: subscription?.daysRemaining ?? 0,
      loading,
      refresh,
    }),
    [subscription, loading, refresh],
  );

  return value;
}
