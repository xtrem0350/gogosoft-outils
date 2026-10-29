//  src/hooks/useUserRole.ts

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { isDemoMode } from "@/services/demoService";
import { isSimulationMode } from "@/services/simulationService";
import { supabase } from "@/integrations/supabase/client";

export type UserRole =
  | "owner"
  | "technicien"
  | "caissier"
  | "magasinier"
  | "receptionniste"
  | "vendeur"
  | "super_admin"
  | null;
export type ViewMode = "admin" | "shop";

export interface UserRoleInfo {
  role: UserRole;
  isOwner: boolean;
  isTechnicien: boolean;
  isCaissier: boolean;
  isMagasinier: boolean;
  isReceptionniste: boolean;
  isVendeur: boolean;
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
  if (
    role === "owner" ||
    role === "caissier" ||
    role === "magasinier" ||
    role === "receptionniste" ||
    role === "vendeur"
  ) return role;
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
  const isDemo = isDemoMode();
  const isSimulation = isSimulationMode();

  useEffect(() => {
    let active = true;
    if (isSimulation) {
      setShopRole("owner");
      setLoading(false);
      return () => { active = false; };
    }
    if (isDemo) {
      setLoading(false);
      return () => { active = false; };
    }
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
    void (async () => {
      let resolvedRole: UserRole = null;

      const { data: rolesData } = await supabase
        .from("user_roles_by_shop" as never)
        .select("role")
        .eq("user_id", user.id)
        .eq("shop_id", shopId);

      const roles = [...new Set(
        ((rolesData ?? []) as Array<{ role?: string | null }> )
          .map((entry) => normalizeRole(entry.role))
          .filter((entry): entry is NonNullable<UserRole> => entry !== null),
      )];
      const storedRole = typeof window !== "undefined"
        ? window.sessionStorage.getItem("gogosoft.activeRole")
        : null;
      const validStoredRole: UserRole = storedRole
        ? (normalizeRole(storedRole) ?? null)
        : null;
      resolvedRole = validStoredRole && roles.includes(validStoredRole)
        ? validStoredRole
        : roles[0] ?? null;

      if (!resolvedRole) {
        const { data: legacy } = await supabase
          .from("shop_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("shop_id", shopId)
          .maybeSingle();
        resolvedRole = normalizeRole(legacy?.role ?? null);
      }

      if (!active) return;
      setShopRole(resolvedRole);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setShopRole(null);
      setLoading(false);
    });

    return () => { active = false; };
  }, [authLoading, isDemo, isSimulation, shopId, shopLoading, user]);

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

  if (isDemo) {
    return {
      role: "owner",
      isOwner: true,
      isTechnicien: false,
      isCaissier: false,
      isMagasinier: false,
      isReceptionniste: false,
      isVendeur: false,
      isSuperAdmin: false,
      isSuperAdminAccount: false,
      viewMode: "shop",
      setViewMode: () => {},
      loading: false,
    };
  }

  if (isSimulation) {
    return {
      role: "owner",
      isOwner: true,
      isTechnicien: false,
      isCaissier: false,
      isMagasinier: false,
      isReceptionniste: false,
      isVendeur: false,
      isSuperAdmin: false,
      isSuperAdminAccount: false,
      viewMode: "shop",
      setViewMode: () => {},
      loading: false,
    };
  }

  const role: UserRole = isSuperAdminAccount && viewMode === "admin" ? "super_admin" : shopRole;
  return {
    role,
    isOwner: role === "owner",
    isTechnicien: role === "technicien",
    isCaissier: role === "caissier",
    isMagasinier: role === "magasinier",
    isReceptionniste: role === "receptionniste",
    isVendeur: role === "vendeur",
    isSuperAdmin: role === "super_admin",
    isSuperAdminAccount,
    viewMode,
    setViewMode,
    loading: authLoading || shopLoading || loading,
  };
}
