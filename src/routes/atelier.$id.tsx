import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteTicket,
  getTicketById,
  updateTicketStatus,
  ISSUES_DATABASE,
  type WorkshopStatus,
  type WorkshopTicket,
} from "@/services/workshopService";

export const Route = createFileRoute("/atelier/$id")({ component: WorkshopDetailsPage });

/** Détail et suivi d'une fiche d'atelier. */
function WorkshopDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<WorkshopTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void getTicketById(id)
      .then(setTicket)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Impossible de charger la fiche."),
      );
  }, [id]);

  async function changeStatus(status: WorkshopStatus) {
    try {
      setTicket(await updateTicketStatus(id, status));
      toast.success("Statut mis à jour.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Action impossible.");
    }
  }
  async function remove() {
    try {
      await deleteTicket(id);
      toast.success("Fiche supprimée.");
      await navigate({ to: "/atelier" });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Suppression impossible.");
    }
  }

  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!ticket) return <div className="p-6 text-muted-foreground">Chargement de la fiche...</div>;
  const diagnosis = ticket.diagnosis as { tools?: string[]; process?: string[] } | null;
  const statusLabel: Record<WorkshopStatus, string> = {
    en_attente: "En attente",
    en_cours: "En cours",
    termine: "Terminé",
    livre: "Livré",
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link to="/atelier">
          <ArrowLeft />
          Retour à l'atelier
        </Link>
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Fiche d'atelier</p>
          <h1 className="mt-2 text-3xl font-bold">{ticket.device_model}</h1>
        </div>
        <Badge>{statusLabel[ticket.status]}</Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Nom :</strong> {ticket.client_name}
            </p>
            <p>
              <strong>WhatsApp :</strong> {ticket.client_whatsapp}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appareil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Modèle :</strong> {ticket.device_model}
            </p>
            <p>
              <strong>Processeur :</strong> {ticket.device_processor ?? "Non renseigné"}
            </p>
            <p>
              <strong>IMEI :</strong> {ticket.device_imei ?? "Non renseigné"}
            </p>
            <p>
              <strong>SN :</strong> {ticket.device_sn ?? "Non renseigné"}
            </p>
            <p>
              <strong>OS :</strong> {ticket.device_os_version ?? "Non renseigné"}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pannes constatées</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ticket.issues.map((issue) => (
            <Badge key={issue} variant="secondary">
              {ISSUES_DATABASE[issue as keyof typeof ISSUES_DATABASE]?.label ?? issue}
            </Badge>
          ))}
        </CardContent>
      </Card>
      {diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Outils nécessaires</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {(diagnosis.tools ?? []).map((tool: string) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Processus</h3>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                {(diagnosis.process ?? []).map((step: string) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
      {ticket.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{ticket.notes}</CardContent>
        </Card>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => void changeStatus("en_cours")}
          disabled={ticket.status === "en_cours"}
        >
          Marquer en cours
        </Button>
        <Button onClick={() => void changeStatus("termine")} disabled={ticket.status === "termine"}>
          Marquer terminé
        </Button>
        <Button variant="destructive" onClick={() => void remove()}>
          <Trash2 />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
