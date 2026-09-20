import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/profil")({ component: ProfilPage });

function ProfilPage() {
  return (
    <RoutePage
      eyebrow="Compte"
      title="Profil"
      description="Retrouvez vos informations, votre rôle et votre activité personnelle."
      icon={UserRound}
      actionLabel="Retour au tableau de bord"
      actionTo="/outils"
    />
  );
}
