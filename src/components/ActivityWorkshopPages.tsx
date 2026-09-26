import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import {
  createTicket,
  generateDiagnosis,
  getTicketById,
  getTickets,
  ISSUES_DATABASE,
  type IssueKey,
  type ActivityType,
  type WorkshopTicket,
} from "@/services/workshopService";

const activityLabels: Record<ActivityType, { noun: string; title: string; create: string }> = {
  phone: { noun: "téléphone", title: "Fiches téléphone", create: "Nouvelle réparation téléphone" },
  computer: { noun: "ordinateur", title: "Fiches ordinateur", create: "Nouvelle réparation PC" },
  consumable: { noun: "consommable", title: "Stock consommables", create: "Ajouter un consommable" },
};

const statusLabels: Record<WorkshopTicket["status"], string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
};

export function ActivityListPage({
  activityType,
  history = false,
}: {
  activityType: ActivityType;
  history?: boolean;
}) {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("tous");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const labels = activityLabels[activityType];
  const basePath = activityType === "consumable" ? "/consumable/stock" : `/${activityType}/atelier`;
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "tous" && ticket.status !== statusFilter) return false;
    if (!ticket.created_at) return !startDate && !endDate;
    const created = new Date(ticket.created_at).getTime();
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    return created >= start && created <= end;
  });

  useEffect(() => {
    if (shopLoading) return;
    setLoading(true);
    void getTickets(shopId, activityType)
      .then(setTickets)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [activityType, shopId, shopLoading]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Suivi</p>
          <h1 className="mt-2 text-3xl font-bold">{history ? `Historique ${labels.noun}` : labels.title}</h1>
          <p className="mt-2 text-muted-foreground">Fiches enregistrées pour votre atelier.</p>
        </div>
        {!history ? <Button asChild><a href={`${basePath}/nouveau`}>{labels.create}</a></Button> : null}
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <label className="grid gap-1.5 text-sm font-semibold">Statut
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 font-normal">
            <option value="tous">Tous</option><option value="en_attente">En attente</option><option value="en_cours">En cours</option><option value="termine">Terminé</option><option value="livre">Livré</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Du
          <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="h-10 rounded-md border bg-background px-3 font-normal" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Au
          <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="h-10 rounded-md border bg-background px-3 font-normal" />
        </label>
        <p className="pb-2 text-sm text-muted-foreground">{filteredTickets.length} fiche(s)</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {!loading && !shopLoading && filteredTickets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Aucune fiche enregistrée.</p>
      ) : null}
      <div className="grid gap-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-semibold">{ticket.device_model}</h2>
                <p className="text-sm text-muted-foreground">{ticket.client_name} · {ticket.client_whatsapp}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{statusLabels[ticket.status]}</Badge>
                <Button asChild variant="outline" size="sm">
                  <a href={`${basePath}/${ticket.id}`}>Détails</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function NewActivityPage({ activityType }: { activityType: ActivityType }) {
  const navigate = useNavigate();
  const { shopId } = useCurrentShop();
  const labels = activityLabels[activityType];
  const listPath = activityType === "consumable" ? "/consumable/stock" : `/${activityType}/atelier`;
  const isConsumable = activityType === "consumable";
  const [issue, setIssue] = useState<IssueKey>("ecran_casse");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("Sélectionnez un atelier.");
      return;
    }
    const values = new FormData(event.currentTarget);
    try {
      await createTicket({
        shop_id: shopId,
        activity_type: activityType,
        ...(isConsumable ? { category: String(values.get("category") ?? "") } : {}),
        client_name: String(values.get("client_name") ?? ""),
        client_whatsapp: String(values.get("client_whatsapp") ?? ""),
        device_model: String(values.get("device_model") ?? ""),
        device_processor: String(values.get("device_processor") ?? ""),
        device_imei: String(values.get("device_imei") ?? ""),
        device_sn: String(values.get("device_sn") ?? ""),
        issues: [issue],
        diagnosis: generateDiagnosis([issue]),
        notes: String(values.get("notes") ?? ""),
      });
      toast.success("Enregistrement effectué.");
      await navigate({ to: listPath });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{labels.title}</p>
        <h1 className="mt-2 text-3xl font-bold">{labels.create}</h1>
      </div>
      <form onSubmit={(event) => void submit(event)} className="grid gap-4 rounded-lg border bg-card p-6">
        {isConsumable ? <Input name="category" placeholder="Catégorie" required /> : null}
        <Input name="client_name" placeholder={isConsumable ? "Fournisseur ou client" : "Nom du client"} required />
        <Input name="client_whatsapp" placeholder="WhatsApp" required />
        <Input name="device_model" placeholder={isConsumable ? "Nom du consommable" : "Modèle"} required />
        {!isConsumable ? <>
          <Input name="device_processor" placeholder="Processeur" />
          <Input name="device_imei" placeholder="IMEI" />
          <Input name="device_sn" placeholder="Numéro de série" />
          <label className="grid gap-2 text-sm font-medium">Problème constaté
            <select value={issue} onChange={(event) => setIssue(event.target.value as IssueKey)} className="h-10 rounded-md border bg-background px-3">
              {Object.entries(ISSUES_DATABASE).map(([key, definition]) => <option key={key} value={key}>{definition.label}</option>)}
            </select>
          </label>
        </> : null}
        <Input name="notes" placeholder="Notes" />
        <Button type="submit">Enregistrer</Button>
      </form>
    </section>
  );
}

export function ActivityDetailsPage({ activityType, id }: { activityType: ActivityType; id: string }) {
  const [ticket, setTicket] = useState<WorkshopTicket | null>(null);
  useEffect(() => {
    void getTicketById(id, activityType).then(setTicket);
  }, [activityType, id]);
  if (!ticket) return <p className="text-muted-foreground">Chargement…</p>;
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold">{ticket.device_model}</h1>
      <Card><CardContent className="space-y-2 p-5"><p>{ticket.client_name}</p><p>{ticket.client_whatsapp}</p><p>{ticket.notes}</p><Badge>{statusLabels[ticket.status]}</Badge></CardContent></Card>
    </section>
  );
}

export function ActivityHistoryPage({ activityType }: { activityType: ActivityType }) {
  return <ActivityListPage activityType={activityType} history />;
}

export function ExperienceBookPage({ activityType }: { activityType: Exclude<ActivityType, "consumable"> }) {
  return <section className="space-y-3"><h1 className="text-3xl font-bold">Carnet d'expérience {activityLabels[activityType].noun}</h1><p className="text-muted-foreground">Module en construction.</p></section>;
}
