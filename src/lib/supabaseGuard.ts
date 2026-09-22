import { supabase } from "@/integrations/supabase/client";

/** Vérifie qu'une session Supabase active existe avant une requête métier. */
export async function hasActiveSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

/** Garantit qu'une requête multi-tenant dispose d'une boutique valide. */
export function requireShopId(shopId: string | null | undefined): string {
  if (!shopId) throw new Error("NO_SHOP_ID");
  return shopId;
}
