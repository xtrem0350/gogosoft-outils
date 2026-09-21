import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth", search: { redirect: location.pathname } });
    }
  }, [loading, location.pathname, navigate, user]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
