import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { AdminInfoPage } from "@/components/AdminInfoPage";

export const Route = createFileRoute("/admin/annonces")({
  component: () => (
    <AdminInfoPage
      title="Annonces"
      description="Publiez une annonce plateforme à tous les abonnés."
      icon={Megaphone}
      imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
      destination="/admin/notifications"
      action="Publier une annonce"
    />
  ),
});
