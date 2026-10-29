import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/useCurrentShop";

export interface PendingItems {
  pendingCaisse: number;
  pendingReception: number;
  pendingReparation: number;
  pendingVentes: number;
}

export function usePendingItems(role: string): PendingItems {
  const { shopId } = useCurrentShop();
  const [pendingItems, setPendingItems] = useState<PendingItems>({
    pendingCaisse: 0,
    pendingReception: 0,
    pendingReparation: 0,
    pendingVentes: 0,
  });

  useEffect(() => {
    if (!shopId || !role) {
      setPendingItems({ pendingCaisse: 0, pendingReception: 0, pendingReparation: 0, pendingVentes: 0 });
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        const next: PendingItems = {
          pendingCaisse: 0,
          pendingReception: 0,
          pendingReparation: 0,
          pendingVentes: 0,
        };
        if (role === "caissier" || role === "owner") {
          const [tickets, sales] = await Promise.all([
            supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["en_attente_caissier_entree", "en_attente_caissier_solde"]),
            supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("payment_status", "en_attente_caissier"),
          ]);
          if (tickets.error) console.warn("[usePendingItems] caisse ateliers:", tickets.error);
          if (sales.error) console.warn("[usePendingItems] caisse ventes:", sales.error);
          next.pendingCaisse = (tickets.count ?? 0) + (sales.count ?? 0);
        }
        if (role === "receptionniste" || role === "owner") {
          const result = await supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "en_attente_receptionniste");
          if (result.error) console.warn("[usePendingItems] réception:", result.error);
          next.pendingReception = result.count ?? 0;
        }
        if (role === "technicien" || role === "owner") {
          const result = await supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "en_attente_technicien");
          if (result.error) console.warn("[usePendingItems] réparation:", result.error);
          next.pendingReparation = result.count ?? 0;
        }
        if (role === "vendeur" || role === "owner") {
          const result = await supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("payment_status", ["en_attente_caissier", "payee"]);
          if (result.error) console.warn("[usePendingItems] ventes:", result.error);
          next.pendingVentes = result.count ?? 0;
        }
        if (active) setPendingItems(next);
      } catch (error) {
        console.warn("[usePendingItems] Impossible de charger les éléments en attente.", error);
        if (active) setPendingItems({ pendingCaisse: 0, pendingReception: 0, pendingReparation: 0, pendingVentes: 0 });
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [role, shopId]);

  return pendingItems;
}
