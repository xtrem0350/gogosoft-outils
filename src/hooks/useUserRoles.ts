//  src/hooks/useUserRoles.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { isDemoMode } from "@/services/demoService";
import { getUserShopRoles } from "@/services/roleService";
import { useUserRole } from "@/hooks/useUserRole";

export type ShopRole =
  | "owner"
  | "technicien"
  | "caissier"
  | "magasinier"
  | "receptionniste"
  | "vendeur"
  | "super_admin";

export const ROLE_LABELS: Record<string, string> = {
  owner: "Chef d'Atelier",
  reparateur: "Réparateur",
  technicien: "Technicien",
  technicien_pc: "Technicien",
  caissier: "Caissier",
  receptionniste: "Réceptionniste",
  magasinier: "Magasinier",
  vendeur: "Vendeur",
  super_admin: "Super Admin",
  manager: "Chef d'Atelier",
  admin: "Chef d'Atelier",
};

export function getRoleLabel(role: string | null | undefined): string {
  const trimmedRole = role?.trim();
  if (!trimmedRole) return "Non attribué";
  const normalizedRole = trimmedRole.toLowerCase();
  return ROLE_LABELS[normalizedRole] ?? trimmedRole;
}

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
const OWNER_SWITCHABLE_ROLES = [
  "owner",
  "technicien",
  "caissier",
  "magasinier",
  "receptionniste",
  "vendeur",
] as const;

export function useUserRoles(): UseUserRolesResult {
  const { user, loading: authLoading } = useAuth();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { isSuperAdmin, isSuperAdminAccount } = useUserRole();
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRoleState] = useState<string>("");
  const [loading, setLoading] = useState(true);

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

    if (isSuperAdmin) {
      setRoles(["super_admin"]);
      setActiveRoleState("super_admin");
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
        let nextRoles = await getUserShopRoles(shopId);
        if (!active) return;
        setRoles(nextRoles);

        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
        const fallbackRole = nextRoles[0] ?? "";
        const nextActiveRole =
          stored &&
          (nextRoles.includes(stored) ||
            (nextRoles.includes("owner") &&
              OWNER_SWITCHABLE_ROLES.some((role) => role === stored)))
            ? stored
            : fallbackRole;
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
  }, [authLoading, isDemo, isSuperAdmin, shopId, shopLoading, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeRole) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, activeRole);
  }, [activeRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRoleChange = () => {
      const selectedRole = window.sessionStorage.getItem(STORAGE_KEY);
      if (!selectedRole) return;
      const canSelectRole =
        roles.includes(selectedRole) ||
        (roles.includes("owner") && OWNER_SWITCHABLE_ROLES.some((role) => role === selectedRole));
      if (canSelectRole) setActiveRoleState(selectedRole);
    };
    window.addEventListener("gogosoft:role-changed", handleRoleChange);
    return () => window.removeEventListener("gogosoft:role-changed", handleRoleChange);
  }, [roles]);

  const setActiveRole = useCallback((role: string) => {
    if (!role) return;
    const canSelectRole =
      roles.includes(role) ||
      (roles.includes("owner") && OWNER_SWITCHABLE_ROLES.some((availableRole) => availableRole === role));
    if (!canSelectRole) return;
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, role);
      window.dispatchEvent(new Event("gogosoft:role-changed"));
    }
  }, [roles]);

  useEffect(() => {
    if (roles.length === 0) {
      setActiveRoleState("");
      return;
    }
    const isOwnerSwitchableRole =
      roles.includes("owner") &&
      OWNER_SWITCHABLE_ROLES.some((role) => role === activeRole);
    if (!roles.includes(activeRole) && !isOwnerSwitchableRole) {
      const firstRole = roles[0];
      if (firstRole) {
        setActiveRoleState(firstRole);
      }
    }
  }, [activeRole, roles]);

  const isOwner = roles.includes("owner");

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

  const value = useMemo<UseUserRolesResult>(
    () => ({
      roles,
      activeRole,
      setActiveRole,
      hasRole,
      isOwner: roles.includes("owner"),
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
