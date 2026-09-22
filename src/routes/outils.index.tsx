import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/outils/")({ component: OutilsPage });

function OutilsPage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Catalogue</p><h1 className="mt-2 text-3xl font-bold">Outils</h1><p className="mt-2 text-muted-foreground">Retrouvez les utilitaires de l'atelier, leurs versions et leurs emplacements.</p></div>;
}
