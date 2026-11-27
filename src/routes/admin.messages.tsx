import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { AdminInfoPage } from "@/components/AdminInfoPage";

export const Route = createFileRoute("/admin/messages")({
  component: () => (
    <AdminInfoPage
      title="Messages aux abonnés"
      description="Les messages globaux sont gérés depuis le centre de notifications."
      icon={MessageSquare}
      imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
      destination="/admin/notifications"
      action="Créer une notification"
    />
  ),
});
