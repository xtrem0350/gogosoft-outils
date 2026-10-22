import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "technicien" | "caissier" | "super_admin" | null;
export type ViewMode = "admin" | "shop";

export interface UserRoleInfo {
  role: UserRole;
  isOwner: boolean;
  isTechnicien: boolean;
  isCaissier: boolean;
  isSuperAdmin: boolean;
  isSuperAdminAccount: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loading: boolean;
}

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "shop";
  return window.sessionStorage.getItem("gogosoft.viewMode") === "admin" ? "admin" : "shop";
}

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "owner" || role === "caissier") return role;
  if (role === "technicien" || role === "technicien_pc") return "technicien";
  if (role === "manager" || role === "admin") return "owner";
  return null;
}

export function useUserRole(): UserRoleInfo {
  const { user, profile, loading: authLoading } = useAuth();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [shopRole, setShopRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>(getInitialViewMode);
  const isSuperAdminAccount = profile?.is_super_admin === true;

  useEffect(() => {
    let active = true;
    if (authLoading || shopLoading) return () => { active = false; };
    if (!user) {
      setShopRole(null);
      setLoading(false);
      return () => { active = false; };
    }
    if (!shopId) {
      setShopRole(null);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    void supabase
      .from("shop_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("shop_id", shopId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setShopRole(null);
        } else {
          setShopRole(normalizeRole(data?.role ?? null));
        }
      })
      .catch(() => {
        if (active) setShopRole(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, shopId, shopLoading, user]);

  useEffect(() => {
    if (!isSuperAdminAccount && viewMode !== "shop") {
      setViewModeState("shop");
      if (typeof window !== "undefined") window.sessionStorage.setItem("gogosoft.viewMode", "shop");
    }
  }, [isSuperAdminAccount, viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    if (typeof window !== "undefined") window.sessionStorage.setItem("gogosoft.viewMode", mode);
    setViewModeState(mode);
  }, []);

  const role: UserRole = isSuperAdminAccount && viewMode === "admin" ? "super_admin" : shopRole;
  return {
    role,
    isOwner: role === "owner",
    isTechnicien: role === "technicien",
    isCaissier: role === "caissier",
    isSuperAdmin: role === "super_admin",
    isSuperAdminAccount,
    viewMode,
    setViewMode,
    loading: authLoading || shopLoading || loading,
  };
}
