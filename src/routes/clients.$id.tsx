import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteClient,
  getClientById,
  getClientPhotoUrl,
  type ClientRecord,
} from "@/services/clientService";
import { getTickets, type WorkshopTicket } from "@/services/workshopService";

interface ClientRepair {
  ticket: WorkshopTicket;
  activityType: "phone" | "computer";
}

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetailsPage,
});

function ClientDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<ClientRepair[]>([]);

  useEffect(() => {
    void getClientById(id)
      .then(async (record) => {
        setClient(record);
        if (!record) return;
        const [photo, phoneTickets, computerTickets] = await Promise.all([
          getClientPhotoUrl(record),
          getTickets(record.shop_id, "phone"),
          getTickets(record.shop_id, "computer"),
        ]);
        setPhotoUrl(photo);
        setRepairs(
          [
            ...phoneTickets
              .filter((ticket) => ticket.client_id === record.id)
              .map((ticket) => ({ ticket, activityType: "phone" as const })),
            ...computerTickets
              .filter((ticket) => ticket.client_id === record.id)
              .map((ticket) => ({ ticket, activityType: "computer" as const })),
          ].sort((left, right) =>
            (right.ticket.created_at ?? "").localeCompare(left.ticket.created_at ?? ""),
          ),
        );
      })
      .catch(() => setClient(null));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteClient(id);
      toast.success("Client supprimé.");
      await navigate({ to: "/clients" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  const waLink = client
    ? `https://wa.me/${client.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${client.full_name}, votre appareil est prêt.`)}`
    : "#";

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Chargement du client...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={client.full_name}
              className="size-24 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-muted text-3xl font-semibold text-muted-foreground">
              {client.full_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Client</p>
            <h1 className="mt-2 truncate text-3xl font-bold">{client.full_name}</h1>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <MessageCircle className="size-4" /> {client.whatsapp}
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <a href={`/phone/atelier/nouveau?clientId=${encodeURIComponent(client.id)}`}>
              + Nouvelle fiche pour ce client
            </a>
          </Button>
          <Button variant="outline" onClick={() => void navigate({ to: "/clients" })}>
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">WhatsApp :</span>{" "}
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <MessageCircle className="size-4" />
              {client.whatsapp}
            </a>
          </p>
          <p>
            <span className="font-semibold">Email :</span> {client.email || "—"}
          </p>
          <p>
            <span className="font-semibold">Adresse :</span> {client.address || "—"}
          </p>
          <p>
            <span className="font-semibold">Notes :</span> {client.notes || "—"}
          </p>
          <p>
            <span className="font-semibold">Total réparations :</span> {client.total_repairs ?? 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des réparations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {repairs.length ? (
            repairs.map(({ ticket, activityType }) => (
              <a
                key={ticket.id}
                href={`/${activityType}/atelier/${ticket.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <span>
                  <span className="block font-medium">{ticket.device_model || "Appareil"}</span>
                  <span className="text-sm text-muted-foreground">
                    {activityType === "phone" ? "Téléphone" : "Ordinateur"}
                    {ticket.created_at
                      ? ` · ${new Date(ticket.created_at).toLocaleDateString("fr-FR")}`
                      : ""}
                  </span>
                </span>
                <span className="text-sm font-medium">{ticket.status.replaceAll("_", " ")}</span>
              </a>
            ))
          ) : (
            <p className="text-muted-foreground">Aucune réparation enregistrée pour ce client.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
