import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/statistiques")({ component: StatistiquesPage });

function StatistiquesPage() {
  return (
    <RoutePage
      eyebrow="Pilotage"
      title="Statistiques"
      description="Suivez l'activité de l'équipe et identifiez les outils les plus utilisés."
      icon={BarChart3}
      actionLabel="Consulter l'historique"
      actionTo="/historique"
    />
  );
}
