import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getMySubscription, isSubscriptionActive, type SubscriptionSummary } from "@/services/subscriptionService";

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getMySubscription();
      setSubscription(next);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void refresh();
      }
    });

    return () => {
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
