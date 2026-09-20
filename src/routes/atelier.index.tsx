import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTickets, type WorkshopStatus, type WorkshopTicket } from "@/services/workshopService";

export const Route = createFileRoute("/atelier/")({ component: WorkshopListPage });
type Filter = "tous" | WorkshopStatus;

/** Liste filtrable des fiches de l'atelier. */
function WorkshopListPage() {
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [filter, setFilter] = useState<Filter>("tous");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getTickets().then(setTickets).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Impossible de charger les fiches.")); }, []);
  const filtered = filter === "tous" ? tickets : tickets.filter((ticket) => ticket.status === filter);
  const statusLabel: Record<WorkshopStatus, string> = { en_attente: "En attente", en_cours: "En cours", termine: "Terminé" };
  const statusClass: Record<WorkshopStatus, string> = { en_attente: "bg-muted text-muted-foreground", en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", termine: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" };

  return <div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Suivi</p><h1 className="mt-2 text-3xl font-bold">Atelier</h1><p className="mt-2 text-muted-foreground">Les réparations en cours et leur diagnostic.</p></div><Button asChild><Link to="/atelier/nouveau"><Plus />Nouvelle fiche</Link></Button></div>
    <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}><TabsList><TabsTrigger value="tous">Tout</TabsTrigger><TabsTrigger value="en_attente">En attente</TabsTrigger><TabsTrigger value="en_cours">En cours</TabsTrigger><TabsTrigger value="termine">Terminé</TabsTrigger></TabsList></Tabs>
    {error && <p className="text-sm text-destructive">{error}</p>}{filtered.length === 0 && !error && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Aucune fiche pour ce filtre.</p>}
    <div className="grid gap-4">{filtered.map((ticket) => <Card key={ticket.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">{ticket.client_name}</h2><p className="text-sm text-muted-foreground">{ticket.device_model} · {ticket.client_whatsapp}</p></div><div className="flex items-center gap-3"><Badge className={statusClass[ticket.status]}>{statusLabel[ticket.status]}</Badge><Button asChild variant="outline" size="sm"><Link to="/atelier/$id" params={{ id: ticket.id }}>Voir le diagnostic</Link></Button></div></CardContent></Card>)}</div>
  </div>;
}
