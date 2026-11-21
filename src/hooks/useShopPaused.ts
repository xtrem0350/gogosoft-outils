import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function useShopPaused(slug: string) {
  const [status, setStatus] = useState<{
    slug: string | null;
    isPaused: boolean;
    isLoading: boolean;
  }>({ slug: null, isPaused: false, isLoading: true });

  useEffect(() => {
    let active = true;
    const shopTable = (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{
              data: { is_paused?: boolean } | null;
              error: Error | null;
            }>;
          };
        };
      };
    }).from("shops");
    void shopTable
      .select("is_paused")
      .eq("shop_slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setStatus({ slug, isPaused: data?.is_paused === true, isLoading: false });
      })
      .catch((reason: unknown) => {
        if (active) {
          setStatus({ slug, isPaused: true, isLoading: false });
          toast.error(
            reason instanceof Error
              ? reason.message
              : "Impossible de vérifier l’état de la boutique.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return {
    isPaused: status.slug === slug && status.isPaused,
    isPauseLoading: status.slug !== slug || status.isLoading,
  };
}
