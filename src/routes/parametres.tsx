import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/parametres")({ component: ParametresPage });

function ParametresPage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Configuration</p><h1 className="mt-2 text-3xl font-bold">Paramètres</h1><p className="mt-2 text-muted-foreground">Personnalisez l'apparence et les préférences de votre espace de travail.</p></div>;
}
