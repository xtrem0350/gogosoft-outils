import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/parametres/emplacements")({
  component: StorageLocationsRedirect,
});

function StorageLocationsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/parametres", search: { tab: "rangements" }, replace: true });
  }, [navigate]);

  return null;
}
