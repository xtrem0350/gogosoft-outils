import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/equipe")({ component: EquipePage });

function EquipePage() {
  return (
    <RoutePage
      eyebrow="Collaboration"
      title="Équipe"
      description="Gérez les membres qui partagent le catalogue et l'activité de l'atelier."
      icon={UsersRound}
      actionLabel="Ouvrir les paramètres"
      actionTo="/parametres"
    />
  );
}
