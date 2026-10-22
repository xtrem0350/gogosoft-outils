import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useUserRole, type UserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const allowed = role !== null && allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && !allowed) void navigate({ to: "/dashboard" });
  }, [allowed, loading, navigate]);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!allowed) return null;
  return <>{children}</>;
}
