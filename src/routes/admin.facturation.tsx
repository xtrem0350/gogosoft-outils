import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";

import { AdminInfoPage } from "@/components/AdminInfoPage";

export const Route = createFileRoute("/admin/facturation")({
  component: () => (
    <AdminInfoPage
      title="Facturation"
      description="Consultez les règlements et gérez la grille tarifaire des abonnements."
      icon={Receipt}
      imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
      destination="/admin/paiements"
      action="Voir les paiements"
    />
  ),
});
