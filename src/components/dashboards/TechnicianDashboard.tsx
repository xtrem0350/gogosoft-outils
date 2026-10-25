import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Plus, Wrench } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTicketsByTechnician, type WorkshopTicket } from "@/services/workshopService";

export function TechnicianDashboard() {
  const { user } = useAuth();
  const { shopId } = useCurrentShop();
  const [assigned, setAssigned] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user || !shopId) {
      setAssigned([]);
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
    ])
      .then(([phoneTickets, computerTickets]) => {
        if (!active) return;
        setAssigned(
          [...phoneTickets, ...computerTickets]
            .filter((ticket) => ticket.status !== "livre")
            .sort((left, right) =>
              (right.created_at ?? "").localeCompare(left.created_at ?? ""),
            )
            .slice(0, 20),
        );
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
  }, [shopId, user]);

  const inProgress = assigned.filter((ticket) => ticket.status === "en_cours").length;
  const pending = assigned.filter(
    (ticket) => ticket.status === "en_attente" || ticket.status === "diagnostique",
  ).length;
  const done = assigned.filter((ticket) => ticket.status === "termine").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon espace technicien</h1>
          <p className="text-sm text-slate-500">Vos fiches assignées et à traiter</p>
        </div>
        <Button asChild>
          <Link to="/phone/atelier/nouveau">
            <Plus className="mr-2 size-4" />
            Nouvelle fiche
          </Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">En cours</CardTitle>
            <Clock className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">À traiter</CardTitle>
            <Wrench className="size-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Terminées</CardTitle>
            <CheckCircle2 className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{done}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Mes fiches en cours</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : assigned.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune fiche assignée pour l’instant.</p>
          ) : (
            <div className="space-y-2">
              {assigned.map((ticket) => (
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
    </div>
  );
}
