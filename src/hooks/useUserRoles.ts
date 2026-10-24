import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { isDemoMode } from "@/services/demoService";
import { getUserShopRoles } from "@/services/roleService";

export type ShopRole =
  | "owner"
  | "technicien"
  | "caissier"
  | "magasinier"
  | "receptionniste"
  | "vendeur"
  | "super_admin";

export interface UseUserRolesResult {
  roles: string[];
  activeRole: string;
  setActiveRole: (role: string) => void;
  hasRole: (role: string) => boolean;
  isOwner: boolean;
  isTechnicien: boolean;
  isCaissier: boolean;
  isMagasinier: boolean;
  isReceptionniste: boolean;
  isVendeur: boolean;
  isSuperAdmin: boolean;
  isSuperAdminAccount: boolean;
  loading: boolean;
}

const STORAGE_KEY = "gogosoft.activeRole";

export function useUserRoles(): UseUserRolesResult {
  const { user, profile, loading: authLoading } = useAuth();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRoleState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const isSuperAdminAccount = profile?.is_super_admin === true;
  const isDemo = isDemoMode();

  useEffect(() => {
    if (isDemo) {
      const demoRoles = ["owner", "caissier", "magasinier", "receptionniste", "vendeur", "technicien"];
      setRoles(demoRoles);
      const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
      const nextRole = demoRoles.includes(stored ?? "") ? stored! : "owner";
      setActiveRoleState(nextRole);
      setLoading(false);
      return;
    }

    if (authLoading || shopLoading) return;

    if (!user || !shopId) {
      setRoles([]);
      setActiveRoleState("");
      setLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const nextRoles = await getUserShopRoles(shopId);
        if (!active) return;
        setRoles(nextRoles);

        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
        const fallbackRole = nextRoles[0] ?? "";
        const nextActiveRole = nextRoles.includes(stored ?? "") ? stored! : fallbackRole;
        setActiveRoleState(nextActiveRole);
      } catch {
        if (active) {
          setRoles([]);
          setActiveRoleState("");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, isDemo, shopId, shopLoading, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeRole) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, activeRole);
  }, [activeRole]);

  const setActiveRole = useCallback((role: string) => {
    if (!role) return;
    setActiveRoleState((current) => {
      if (roles.includes(role)) return role;
      return current;
    });
  }, [roles]);

  useEffect(() => {
    if (roles.length === 0) {
      setActiveRoleState("");
      return;
    }
    if (!roles.includes(activeRole)) {
      setActiveRoleState(roles[0]);
    }
  }, [activeRole, roles]);

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

  const isSuperAdmin =
    isSuperAdminAccount &&
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("gogosoft.viewMode") === "admin";

  const value = useMemo<UseUserRolesResult>(
    () => ({
      roles,
      activeRole,
      setActiveRole,
      hasRole,
      isOwner: activeRole === "owner",
      isTechnicien: activeRole === "technicien",
      isCaissier: activeRole === "caissier",
      isMagasinier: activeRole === "magasinier",
      isReceptionniste: activeRole === "receptionniste",
      isVendeur: activeRole === "vendeur",
      isSuperAdmin,
      isSuperAdminAccount,
      loading: authLoading || shopLoading || loading,
    }),
    [activeRole, authLoading, hasRole, isSuperAdmin, isSuperAdminAccount, loading, roles, setActiveRole, shopLoading],
  );

  return value;
}
