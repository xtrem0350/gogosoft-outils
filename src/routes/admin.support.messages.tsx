import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { AdminInfoPage } from "@/components/AdminInfoPage";

export const Route = createFileRoute("/admin/support/messages")({
  component: () => (
    <AdminInfoPage
      title="Messages de support"
      description="Les échanges entrants sont regroupés dans la file des tickets."
      icon={MessageSquare}
      destination="/admin/support"
      action="Voir les tickets"
    />
  ),
});
