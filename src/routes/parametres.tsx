import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/parametres")({ component: ParametresPage });

function ParametresPage() {
  return (
    <RoutePage
      eyebrow="Configuration"
      title="Paramètres"
      description="Personnalisez l'apparence et les préférences de votre espace de travail."
      icon={Settings}
      actionLabel="Voir le profil"
      actionTo="/profil"
    />
  );
}
