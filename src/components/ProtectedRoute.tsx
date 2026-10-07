import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { isDemoMode } from "@/services/demoService";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const demo = isDemoMode();

  useEffect(() => {
    if (!loading && !user && !demo) {
      void navigate({ to: "/auth", search: { redirect: location.pathname } });
    }
  }, [demo, loading, location.pathname, navigate, user]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!user && !demo) {
    return null;
  }

  return <>{children}</>;
}
