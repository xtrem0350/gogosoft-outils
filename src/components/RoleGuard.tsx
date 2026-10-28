import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useUserRole();
  const isSimulation = typeof window !== "undefined" && sessionStorage.getItem("gogosoft.simulation.active") === "true";
  const allowed = role !== null && allowedRoles.includes(role);

  if (isSimulation) return <>{children}</>;
  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!role) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 size-12 text-orange-500" />
        <h2 className="mb-2 text-xl font-bold">Rôle non attribué</h2>
        <p className="mb-4 text-sm text-slate-500">
          Contactez le propriétaire de la boutique pour obtenir un accès.
        </p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }
  if (!allowed) return null;
  return <>{children}</>;
}
