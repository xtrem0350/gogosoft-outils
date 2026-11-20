import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Plus, Wrench } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  assignTicketToTechnician,
  getTicketsByTechnician,
  getUnassignedTickets,
  type WorkshopTicket,
} from "@/services/workshopService";
import { useIsMobile } from "@/hooks/use-mobile";

export function TechnicianDashboard() {
  const { user } = useAuth();
  const { shopId } = useCurrentShop();
  const isMobile = useIsMobile();
  const [assigned, setAssigned] = useState<WorkshopTicket[]>([]);
  const [unassigned, setUnassigned] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user || !shopId) {
      setAssigned([]);
      setUnassigned([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    void Promise.all([
      getTicketsByTechnician(shopId, user.id, "phone"),
      getTicketsByTechnician(shopId, user.id, "computer"),
      getUnassignedTickets(shopId),
    ])
      .then(([phoneTickets, computerTickets, unassignedTickets]) => {
        if (!active) return;
        setAssigned(
          [...phoneTickets, ...computerTickets]
            .sort((left, right) =>
              (right.created_at ?? "").localeCompare(left.created_at ?? ""),
            )
            .slice(0, 20),
        );
        setUnassigned(unassignedTickets);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger vos fiches assignées.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, shopId, user]);

  const currentTickets = assigned.filter((ticket) => ticket.status !== "livre" && ticket.status !== "annule");
  const today = new Date().toISOString().slice(0, 10);
  const inProgress = assigned.filter((ticket) => ticket.status === "en_cours").length;
  const done = assigned.filter((ticket) =>
    ticket.status === "livre" &&
    (ticket.delivered_at ?? ticket.updated_at ?? "").slice(0, 10) === today,
  ).length;

  async function takeTicket(ticket: WorkshopTicket) {
    if (!user) {
      toast.error("Connectez-vous pour prendre en charge cette fiche.");
      return;
    }
    setAssigningTicketId(ticket.id);
    try {
      await assignTicketToTechnician(ticket.id, user.id);
      toast.success("Fiche prise en charge.");
      setRefreshKey((current) => current + 1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de prendre cette fiche.");
    } finally {
      setAssigningTicketId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon espace technicien</h1>
          <p className="text-sm text-slate-500">Vos fiches assignées et à traiter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/phone/atelier">Réparations Téléphone</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/computer/atelier">Réparations PC</Link>
          </Button>
          {!isMobile ? (
            <Button asChild>
              <Link to="/phone/atelier/nouveau">
                <Plus className="mr-2 size-4" />
                Nouvelle fiche
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tickets assignés</CardTitle>
            <Wrench className="size-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{assigned.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">En cours</CardTitle>
            <Clock className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Terminées aujourd'hui</CardTitle>
            <CheckCircle2 className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{done}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Mes fiches assignées</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : currentTickets.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune fiche assignée pour l’instant.</p>
          ) : (
            <div className="space-y-2">
              {currentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={ticket.activity_type === "computer" ? "/computer/atelier/$id" : "/phone/atelier/$id"}
                  params={{ id: ticket.id }}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium">
                      {ticket.ticket_number ?? "Sans numéro"} · {ticket.client_name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {ticket.device_brand} {ticket.device_model}
                    </div>
                  </div>
                  <Badge variant={ticket.status === "en_cours" ? "default" : "secondary"}>
                    {ticket.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fiches non assignées</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : unassigned.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune fiche disponible à la prise en charge.</p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    to={ticket.activity_type === "computer" ? "/computer/atelier/$id" : "/phone/atelier/$id"}
                    params={{ id: ticket.id }}
                    className="min-w-0 flex-1 rounded-md transition-colors hover:text-orange-700"
                  >
                    <div className="font-medium">
                      {ticket.ticket_number ?? "Sans numéro"} · {ticket.client_name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {ticket.device_brand} {ticket.device_model}
                    </div>
                  </Link>
                  <Button
                    type="button"
                    disabled={assigningTicketId !== null}
                    onClick={() => void takeTicket(ticket)}
                  >
                    {assigningTicketId === ticket.id ? "Prise en charge…" : "Prendre en charge"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
