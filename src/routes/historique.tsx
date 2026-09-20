import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/historique")({ component: HistoriquePage });

function HistoriquePage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Traçabilité</p><h1 className="mt-2 text-3xl font-bold">Historique</h1><p className="mt-2 text-muted-foreground">Consultez les derniers lancements et les actions réalisées dans l'atelier.</p></div>;
}
