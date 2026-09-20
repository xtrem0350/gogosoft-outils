import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/historique")({ component: HistoriquePage });

function HistoriquePage() {
  return (
    <RoutePage
      eyebrow="Traçabilité"
      title="Historique"
      description="Consultez les derniers lancements et les actions réalisées dans l'atelier."
      icon={History}
      actionLabel="Voir les statistiques"
      actionTo="/statistiques"
    />
  );
}
