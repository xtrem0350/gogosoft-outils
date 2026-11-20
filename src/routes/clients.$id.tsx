import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReadOnlyGuard } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteClient,
  getClientById,
  getClientPhotoUrl,
  type ClientRecord,
  updateClient,
} from "@/services/clientService";
import { getTickets, type WorkshopTicket } from "@/services/workshopService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientRepair {
  ticket: WorkshopTicket;
  activityType: "phone" | "computer";
}

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetailsPage,
});

function ClientDetailsPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { id } = Route.useParams();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<ClientRepair[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
      await router.invalidate();
      toast.success("Client supprimé.");
      await navigate({ to: "/clients" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || saving) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const updated = await updateClient(client.id, {
        full_name: String(formData.get("full_name") ?? "").trim(),
        whatsapp: String(formData.get("whatsapp") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim() || null,
        address: String(formData.get("address") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
      });
      setClient(updated);
      setEditOpen(false);
      toast.success("Client modifié.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de modifier le client.");
    } finally {
      setSaving(false);
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
          <ReadOnlyGuard>
            <Button asChild>
              <a href={`/phone/atelier/nouveau?clientId=${encodeURIComponent(client.id)}`}>
                + Nouvelle fiche pour ce client
              </a>
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </ReadOnlyGuard>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Modifiez les coordonnées enregistrées du client.</DialogDescription>
          </DialogHeader>
          <ReadOnlyGuard>
          <form onSubmit={(event) => void handleUpdate(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-client-name">Nom complet</Label>
              <Input id="edit-client-name" name="full_name" defaultValue={client.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-whatsapp">WhatsApp</Label>
              <Input id="edit-client-whatsapp" name="whatsapp" defaultValue={client.whatsapp} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-email">Email</Label>
              <Input id="edit-client-email" name="email" type="email" defaultValue={client.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-address">Adresse</Label>
              <Input id="edit-client-address" name="address" defaultValue={client.address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-notes">Notes</Label>
              <Textarea id="edit-client-notes" name="notes" defaultValue={client.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
          </ReadOnlyGuard>
        </DialogContent>
      </Dialog>
    </div>
  );
}
