import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteClient, getClientById, type ClientRecord } from "@/services/clientService";

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetailsPage,
});

function ClientDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [client, setClient] = useState<ClientRecord | null>(null);

  useEffect(() => {
    void getClientById(id)
      .then(setClient)
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

  const waLink = client ? `https://wa.me/${client.whatsapp.replace(/[\s+\-()]/g, "").replace(/\D/g, "")} ?text=${encodeURIComponent(`Bonjour ${client.full_name}, votre appareil est prêt.`)}` : "#";

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Chargement du client...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Client</p>
          <h1 className="mt-2 text-3xl font-bold">{client.full_name}</h1>
        </div>
        <div className="flex gap-2">
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
            <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
              <MessageCircle className="size-4" />
              {client.whatsapp}
            </a>
          </p>
          <p><span className="font-semibold">Email :</span> {client.email || "—"}</p>
          <p><span className="font-semibold">Adresse :</span> {client.address || "—"}</p>
          <p><span className="font-semibold">Notes :</span> {client.notes || "—"}</p>
          <p><span className="font-semibold">Total réparations :</span> {client.total_repairs ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réparations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune réparation enregistrée pour ce client pour le moment.</p>
        </CardContent>
      </Card>
    </div>
  );
}
