import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { getSupportTickets } from "@/services/adminService";

export const Route = createFileRoute("/admin/support")({ component: SupportPage });

function SupportPage() {
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof getSupportTickets>>>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getSupportTickets().then(setTickets).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")); }, []);
  return <div className="mx-auto max-w-6xl space-y-6"><PageHero title="Support" subtitle="Demandes ouvertes des abonnés" icon={MessageSquare} />{error ? <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}<div className="space-y-3">{tickets.map((ticket) => <Card key={ticket.id}><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{ticket.subject}</h2><p className="mt-1 text-xs text-muted-foreground">{ticket.user_id} · {new Date(ticket.created_at).toLocaleString("fr-FR")}</p></div><span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">{ticket.status}</span></div><p className="mt-4 whitespace-pre-wrap text-sm">{ticket.message}</p></CardContent></Card>)}{tickets.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Aucun ticket ouvert.</CardContent></Card> : null}</div></div>;
}