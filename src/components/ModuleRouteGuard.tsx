import { useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { MODULES, type ModuleId } from "@/types/modules";

function requiredModules(pathname: string): ModuleId[] | null {
  const matches = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  const required = Object.values(MODULES)
    .filter((module) => module.routes.some(matches))
    .map((module) => module.id);
  if (matches("/sales")) return ["vente-telephone", "vente-pc"];
  if (matches("/reception")) return ["reparation-telephone", "reparation-pc"];
  if (matches("/magasin")) return ["consommables"];
  if (matches("/atelier")) return ["reparation-telephone"];
  if (matches("/clients")) {
    return [
      "reparation-telephone",
      "reparation-pc",
      "vente-telephone",
      "vente-pc",
      "consommables",
    ];
  }
  return required.length > 0 ? required : null;
}

export function ModuleRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAnyActive, loading } = useActiveModules();
  const notifiedPath = useRef<string | null>(null);
  const required = requiredModules(location.pathname);
  const isSimulation = typeof window !== 'undefined' && sessionStorage.getItem("gogosoft.simulation.active") === "true";
  const allowed = location.pathname === "/boutiques/nouveau" || !required || isAnyActive(required);

  useEffect(() => {
    if (loading || allowed || notifiedPath.current === location.pathname) return;
    notifiedPath.current = location.pathname;
    toast.info("Ce domaine n'est pas activé dans votre offre.");
    void navigate({ to: "/dashboard" });
  }, [allowed, loading, location.pathname, navigate]);

  if (isSimulation) return <>{children}</>; 
  if (loading || !allowed) return null;
  return <>{children}</>;
}