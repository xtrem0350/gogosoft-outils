import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/outils")({ component: OutilsPage });

function OutilsPage() {
  return (
    <RoutePage
      eyebrow="Catalogue"
      title="Outils"
      description="Retrouvez les utilitaires de l'atelier, leurs versions et leurs emplacements."
      icon={Boxes}
      actionLabel="Voir les catégories"
      actionTo="/categories"
    />
  );
}
