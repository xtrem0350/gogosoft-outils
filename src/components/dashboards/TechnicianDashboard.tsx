import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Plus, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadOnlyGuard } from "@/components/SubscriptionGuard";
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
            ),
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
  const inProgress = assigned.filter((ticket) => ticket.status === "en_cours").length;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const doneThisWeek = assigned.filter((ticket) => {
    if (ticket.status !== "livre") return false;
    const completedAt = new Date(ticket.delivered_at ?? ticket.updated_at ?? "");
    return Number.isFinite(completedAt.getTime()) && completedAt >= weekStart;
  }).length;
  const repairDurationByWeek = useMemo(() => {
    const currentWeekStart = new Date();
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));
    const weeks = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - (3 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end, label: start.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), durations: [] as number[] };
    });
    for (const ticket of assigned) {
      if (ticket.status !== "livre" || !ticket.created_at) continue;
      const createdAt = new Date(ticket.created_at);
      const completedAt = new Date(ticket.delivered_at ?? ticket.updated_at ?? "");
      if (!Number.isFinite(createdAt.getTime()) || !Number.isFinite(completedAt.getTime())) continue;
      const durationDays = (completedAt.getTime() - createdAt.getTime()) / 86_400_000;
      if (durationDays < 0) continue;
      const week = weeks.find(({ start, end }) => completedAt >= start && completedAt < end);
      week?.durations.push(durationDays);
    }
    return weeks.map(({ label, durations }) => ({
      week: label,
      averageDays: durations.length
        ? Number((durations.reduce((total, duration) => total + duration, 0) / durations.length).toFixed(1))
        : 0,
      repairs: durations.length,
    }));
  }, [assigned]);

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
            <CardTitle className="text-sm font-medium text-slate-500">Mes réparations en cours</CardTitle>
            <Wrench className="size-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? "…" : inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">En attente de pièces</CardTitle>
            <Clock className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? "…" : assigned.filter((ticket) => ticket.status === "en_attente_pieces").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Terminées cette semaine</CardTitle>
            <CheckCircle2 className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? "…" : doneThisWeek}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temps moyen de réparation</CardTitle>
          <p className="text-sm text-muted-foreground">Durée en jours, selon la semaine de livraison.</p>
        </CardHeader>
        <CardContent>
          {repairDurationByWeek.every((week) => week.repairs === 0) ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune réparation terminée sur les quatre dernières semaines.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repairDurationByWeek} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" j" />
                  <Tooltip formatter={(value) => [`${value} jour(s)`, "Durée moyenne"]} />
                  <Bar dataKey="averageDays" name="Durée moyenne" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mes fiches assignées</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : currentTickets.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune fiche assignée pour l’instant.</p>
          ) : (
            <div className="space-y-2">
              {currentTickets.slice(0, 20).map((ticket) => (
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
                  <ReadOnlyGuard>
                    <Button
                      type="button"
                      disabled={assigningTicketId !== null}
                      onClick={() => void takeTicket(ticket)}
                    >
                      {assigningTicketId === ticket.id ? "Prise en charge…" : "Prendre en charge"}
                    </Button>
                  </ReadOnlyGuard>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
