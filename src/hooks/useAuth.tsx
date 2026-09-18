import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getProfile, getRoles } from "@/services/authService";
import type { AppRole, Profile } from "@/types/database";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  /** Vrai si l'utilisateur possède le rôle demandé. */
  hasRole: (role: AppRole) => boolean;
  /** Peut créer / modifier des outils (admin ou technicien). */
  canEdit: boolean;
  /** Peut supprimer définitivement et administrer (admin). */
  isAdmin: boolean;
  /** Recharge profil et rôles. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Fournit la session, le profil et les rôles à toute l'application. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const loadDetails = async (userId: string | undefined) => {
      if (!userId) {
        setProfile(null);
        setRoles([]);
        return;
      }
      try {
        const [p, r] = await Promise.all([getProfile(userId), getRoles(userId)]);
        if (!active) return;
        setProfile(p);
        setRoles(r);
      } catch {
        /* profil indisponible : l'UI reste utilisable en lecture */
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        void loadDetails(nextSession?.user.id);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadDetails(data.session?.user.id);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const hasRole = (role: AppRole) => roles.includes(role);
    return {
      session,
      user: session?.user ?? null,
      profile,
      roles,
      loading,
      hasRole,
      canEdit: hasRole("admin") || hasRole("technicien"),
      isAdmin: hasRole("admin"),
      refresh: async () => {
        const userId = session?.user.id;
        if (!userId) return;
        const [p, r] = await Promise.all([getProfile(userId), getRoles(userId)]);
        setProfile(p);
        setRoles(r);
      },
    };
  }, [session, profile, roles, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Accès à la session courante, au profil et aux rôles. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
