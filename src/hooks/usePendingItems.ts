// src/hooks/usePendingItems.ts

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/useCurrentShop";

export interface PendingItems {
  pendingCaisse: number;
  pendingReception: number;
  pendingReparation: number;
  pendingVentes: number;
}

type PendingItemsRealtimeTable = "workshop_tickets" | "sales";

interface PendingItemsRealtimeEvent {
  table: PendingItemsRealtimeTable;
  pendingCount: number;
  pendingSalesCount: number;
}

export function usePendingItems(
  role: string,
  onRealtimeEvent?: (event: PendingItemsRealtimeEvent) => void,
): PendingItems {
  const { shopId } = useCurrentShop();
  const onRealtimeEventRef = useRef(onRealtimeEvent);
  const [pendingItems, setPendingItems] = useState<PendingItems>({
    pendingCaisse: 0,
    pendingReception: 0,
    pendingReparation: 0,
    pendingVentes: 0,
  });

  useEffect(() => {
    onRealtimeEventRef.current = onRealtimeEvent;
  }, [onRealtimeEvent]);

  useEffect(() => {
    if (!shopId || !role) {
      setPendingItems({ pendingCaisse: 0, pendingReception: 0, pendingReparation: 0, pendingVentes: 0 });
      return;
    }

    let active = true;
    const refresh = async (realtimeTable?: PendingItemsRealtimeTable) => {
      try {
        const next: PendingItems = {
          pendingCaisse: 0,
          pendingReception: 0,
          pendingReparation: 0,
          pendingVentes: 0,
        };
        let pendingSalesCount = 0;
        if (role === "caissier" || role === "owner") {
          const [tickets, sales] = await Promise.all([
            supabase.from("workshop_tickets").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["en_attente_caissier_entree", "en_attente_caissier_solde"]),
            supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("payment_status", ["pending", "awaiting_payment"]),
          ]);
          if (tickets.error) console.warn("[usePendingItems] caisse ateliers:", tickets.error);
          if (sales.error) console.warn("[usePendingItems] caisse ventes:", sales.error);
          pendingSalesCount = sales.count ?? 0;
          next.pendingCaisse = (tickets.count ?? 0) + pendingSalesCount;
        }
        if (role === "receptionniste" || role === "owner") {
          const [toStore, toDeliver] = await Promise.all([
            supabase.from("workshop_tickets").select("id", { count: "exact", head: true })
              .eq("shop_id", shopId).eq("status", "en_attente_technicien").eq("entry_fee_paid", true),
            supabase.from("workshop_tickets").select("id", { count: "exact", head: true })
              .eq("shop_id", shopId).eq("status", "en_attente_receptionniste"),
          ]);
          if (toStore.error) console.warn("[usePendingItems] fiches à ranger:", toStore.error);
          if (toDeliver.error) console.warn("[usePendingItems] fiches à remettre:", toDeliver.error);
          next.pendingReception = (toStore.count ?? 0) + (toDeliver.count ?? 0);
        }
        if (role === "technicien" || role === "owner") {
          const result = await supabase.from("workshop_tickets").select("id", { count: "exact", head: true })
            .eq("shop_id", shopId).eq("status", "en_attente_technicien").eq("entry_fee_paid", true);
          if (result.error) console.warn("[usePendingItems] réparation:", result.error);
          next.pendingReparation = result.count ?? 0;
        }
        if (role === "vendeur" || role === "owner") {
          const result = await supabase.from("sales").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("payment_status", ["pending", "awaiting_payment"]);
          if (result.error) console.warn("[usePendingItems] ventes:", result.error);
          pendingSalesCount = result.count ?? 0;
          next.pendingVentes = pendingSalesCount;
        }
        if (active) {
          setPendingItems(next);
          if (
            realtimeTable &&
            (realtimeTable !== "sales" ||
              role === "caissier" ||
              role === "vendeur" ||
              role === "owner")
          ) {
            onRealtimeEventRef.current?.({
              table: realtimeTable,
              pendingCount: Object.values(next).reduce((total, count) => total + count, 0),
              pendingSalesCount,
            });
          }
        }
      } catch (error) {
        console.warn("[usePendingItems] Impossible de charger les éléments en attente.", error);
        if (active) setPendingItems({ pendingCaisse: 0, pendingReception: 0, pendingReparation: 0, pendingVentes: 0 });
      }
    };

    void refresh();
    const channelName = `pending_items:${shopId}:${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workshop_tickets", filter: `shop_id=eq.${shopId}` },
        () => void refresh("workshop_tickets"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales", filter: `shop_id=eq.${shopId}` },
        () => void refresh("sales"),
      )
      .subscribe();
    const interval = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [role, shopId]);

  return pendingItems;
}
