import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/useCurrentShop";

export function usePendingItems(role: string) {
  const { shopId } = useCurrentShop();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!shopId || !role) {
      setPendingCount(0);
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        let count = 0;
        if (role === "caissier" || role === "owner") {
          const [tickets, sales] = await Promise.all([
            supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["en_attente_caissier_entree", "en_attente_caissier_solde"]),
            supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "en_attente_caissier"),
          ]);
          count += (tickets.count ?? 0) + (sales.count ?? 0);
        }
        if (role === "receptionniste" || role === "owner") {
          const result = await supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "en_attente_receptionniste");
          count += result.count ?? 0;
        }
        if (role === "technicien" || role === "owner") {
          const result = await supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "en_attente_technicien");
          count += result.count ?? 0;
        }
        if (role === "vendeur") {
          const result = await supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["en_attente_caissier", "payee"]);
          count += result.count ?? 0;
        }
        if (active) setPendingCount(count);
      } catch {
        if (active) setPendingCount(0);
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [role, shopId]);

  return pendingCount;
}
