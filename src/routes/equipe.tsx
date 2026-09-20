import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/equipe")({ component: EquipePage });

function EquipePage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Collaboration</p><h1 className="mt-2 text-3xl font-bold">Équipe</h1><p className="mt-2 text-muted-foreground">Gérez les membres qui partagent le catalogue et l'activité de l'atelier.</p></div>;
}
