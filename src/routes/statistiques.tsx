import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/statistiques")({ component: StatistiquesPage });

function StatistiquesPage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Pilotage</p><h1 className="mt-2 text-3xl font-bold">Statistiques</h1><p className="mt-2 text-muted-foreground">Suivez l'activité de l'équipe et identifiez les outils les plus utilisés.</p></div>;
}
