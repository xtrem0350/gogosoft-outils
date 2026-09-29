import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Laptop, Package, Smartphone, Wrench } from "lucide-react";
import { toast } from "sonner";

import { DeviceCatalogPicker, type CatalogDevice } from "@/components/DeviceCatalogPicker";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { DeviceSelect } from "@/components/selects/DeviceSelect";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { PageHero } from "@/components/PageHero";
import { PageSectionTitle } from "@/components/PageSectionTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { assignTicketToLocation, type StorageLocation } from "@/services/storageService";
import { searchDevices, type KnownDevice } from "@/services/workshopService";
import { getClientById, type ClientRecord } from "@/services/clientService";
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
  consumable: {
    noun: "consommable",
    title: "Stock consommables",
    create: "Ajouter un consommable",
  },
};

const statusLabels: Record<WorkshopTicket["status"], string> = {
  en_attente: "⏳ En attente",
  en_cours: "⚙️ En cours",
  termine: "✅ Terminé",
  livre: "📦 Livré",
};

export function ActivityListPage({
  activityType,
  history = false,
}: {
  activityType: ActivityType;
  history?: boolean;
}) {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("tous");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const labels = activityLabels[activityType];
  const basePath = activityType === "consumable" ? "/consumable/stock" : `/${activityType}/atelier`;
  const heroIcon = activityType === "phone" ? Smartphone : activityType === "computer" ? Laptop : Package;
  const heroColor = activityType === "consumable" ? "green" : "orange";
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "tous" && ticket.status !== statusFilter) return false;
    if (!ticket.created_at) return !startDate && !endDate;
    const created = new Date(ticket.created_at).getTime();
    const start = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    return created >= start && created <= end;
  });

  useEffect(() => {
    if (shopLoading) return;
    setLoading(true);
    void getTickets(shopId, activityType)
      .then(setTickets)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      )
      .finally(() => setLoading(false));
  }, [activityType, shopId, shopLoading]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      {!history ? (
        <PageHero
          title={labels.title}
          subtitle="Fiches enregistrées pour votre atelier."
          icon={heroIcon}
          iconColor={heroColor}
          action={
            <Button onClick={() => void navigate({ to: `${basePath}/nouveau` })}>+ {labels.create}</Button>
          }
        />
      ) : (
        <PageHero
          title={`Historique ${labels.noun}`}
          subtitle="Retrouvez les fiches clôturées et leurs diagnostics."
          icon={heroIcon}
          iconColor={heroColor}
        />
      )}
      <PageSectionTitle
        icon={Wrench}
        color={heroColor}
        title={history ? `Historique ${labels.noun}` : "Liste des fiches"}
        subtitle={history ? "Suivez les fiches clôturées et les interventions passées." : "Cliquez sur une fiche pour la voir."}
      />
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <label className="grid gap-1.5 text-sm font-semibold">
          Statut
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 font-normal"
          >
            <option value="tous">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="livre">Livré</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Du
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Au
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 font-normal"
          />
        </label>
        <p className="pb-2 text-sm text-muted-foreground">{filteredTickets.length} fiche(s)</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {!loading && !shopLoading && filteredTickets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Aucune fiche enregistrée.
        </p>
      ) : null}
      <div className="grid gap-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-semibold">{ticket.device_model}</h2>
                <p className="text-sm text-muted-foreground">
                  {ticket.client_name} · {ticket.client_whatsapp}
                </p>
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
  const [initialClientId] = useState(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("clientId"),
  );
  const labels = activityLabels[activityType];
  const listPath = activityType === "consumable" ? "/consumable/stock" : `/${activityType}/atelier`;
  const isConsumable = activityType === "consumable";
  const [issue, setIssue] = useState<IssueKey>("ecran_casse");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"catalog" | "known" | "free">("catalog");
  const [knownDevicesExist, setKnownDevicesExist] = useState(false);
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceProcessor, setDeviceProcessor] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [deviceOs, setDeviceOs] = useState("");
  const [devicePhoto, setDevicePhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<StorageLocation | null>(null);

  useEffect(() => {
    if (!shopId || !initialClientId) return;
    let active = true;
    void getClientById(initialClientId)
      .then((client) => {
        if (!active || !client || client.shop_id !== shopId) return;
        setSelectedClient(client);
        if (!isConsumable) {
          void searchDevices(shopId, "", activityType, client.id)
            .then((devices) => {
              if (active) setKnownDevicesExist(devices.length > 0);
            })
            .catch(() => {
              if (active) setKnownDevicesExist(false);
            });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [activityType, initialClientId, isConsumable, shopId]);

  function selectClient(client: ClientRecord) {
    setSelectedClient(client);
    setKnownDevicesExist(false);
    setDeviceMode("catalog");
    setDeviceModel("");
    setDeviceProcessor("");
    setDeviceImei("");
    setDeviceSerial("");
    setDeviceOs("");
    setDevicePhoto(null);
    if (!isConsumable && shopId) {
      void searchDevices(shopId, "", activityType, client.id)
        .then((devices) => setKnownDevicesExist(devices.length > 0))
        .catch(() => setKnownDevicesExist(false));
    }
  }

  function setCatalogDevice(device: CatalogDevice) {
    setDeviceModel(device.model);
    setDeviceProcessor(device.processor ?? "");
    setDeviceImei("");
    setDeviceSerial("");
    setDeviceOs("");
    setDevicePhoto(device.imageUrl);
  }

  function setKnownDevice(device: KnownDevice) {
    setDeviceModel(device.device_model);
    setDeviceProcessor(device.device_processor ?? "");
    setDeviceImei(device.device_imei ?? "");
    setDeviceSerial(device.device_sn ?? "");
    setDeviceOs(device.device_os_version ?? "");
    setDevicePhoto(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("⚠️ Sélectionnez un atelier.");
      return;
    }
    if (!selectedClient) {
      toast.error("Sélectionnez un client avant de continuer.");
      return;
    }
    const values = new FormData(event.currentTarget);
    const productName = String(values.get("consumable_name") ?? "").trim();
    const model = isConsumable ? productName : deviceModel.trim();
    if (!model) {
      toast.error(isConsumable ? "Saisissez le nom du consommable." : "Sélectionnez ou saisissez un modèle.");
      return;
    }
    try {
      const ticket = await createTicket({
        shop_id: shopId,
        activity_type: activityType,
        ...(isConsumable ? { category: String(values.get("category") ?? "") } : {}),
        client_id: selectedClient.id,
        client_name: selectedClient.full_name,
        client_whatsapp: selectedClient.whatsapp,
        device_model: model,
        device_processor: isConsumable ? "" : deviceProcessor,
        device_imei: isConsumable ? "" : deviceImei,
        device_sn: isConsumable ? "" : deviceSerial,
        device_os_version: isConsumable ? "" : deviceOs,
        issues: isConsumable ? [] : [issue],
        ...(!isConsumable ? { diagnosis: generateDiagnosis([issue]) } : {}),
        notes: String(values.get("notes") ?? ""),
      });
      if (location) {
        const assigned = await assignTicketToLocation(ticket.id, location.id);
        if (!assigned) toast.error("Fiche créée, mais l'emplacement n'a pas pu être attribué.");
      }
      toast.success("✅ Enregistrement effectué.");
      await navigate({ to: listPath });
    } catch (reason) {
      toast.error(`❌ ${reason instanceof Error ? reason.message : "Enregistrement impossible."}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{labels.title}</p>
        <h1 className="mt-2 text-3xl font-bold">{labels.create}</h1>
      </div>
      <form
        onSubmit={(event) => void submit(event)}
        className="grid gap-4 rounded-lg border bg-card p-6"
      >
        {isConsumable ? <Input name="category" placeholder="Catégorie" required /> : null}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Client *</label>
          <ClientSelect
            shopId={shopId}
            value={selectedClient?.id}
            selectedClient={selectedClient ?? undefined}
            onSelect={selectClient}
            onCreateNew={() => setCreateClientOpen(true)}
          />
          {selectedClient ? (
            <p className="text-sm text-muted-foreground">WhatsApp : {selectedClient.whatsapp}</p>
          ) : null}
        </div>
        {isConsumable ? (
          <Input name="consumable_name" placeholder="Nom du consommable" required />
        ) : (
          <div className="grid gap-3">
            <label className="text-sm font-medium">Appareil *</label>
            {knownDevicesExist ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={deviceMode === "known" ? "default" : "outline"}
                  onClick={() => setDeviceMode("known")}
                >
                  Réutiliser un appareil existant
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={deviceMode === "catalog" ? "default" : "outline"}
                  onClick={() => setDeviceMode("catalog")}
                >
                  Catalogue
                </Button>
              </div>
            ) : null}
            {deviceMode === "known" && selectedClient ? (
              <DeviceSelect
                shopId={shopId}
                clientId={selectedClient.id}
                activityType={activityType}
                onSelect={setKnownDevice}
              />
            ) : deviceMode === "free" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={deviceModel}
                  onChange={(event) => setDeviceModel(event.target.value)}
                  placeholder="Marque et modèle"
                  required
                />
                <Input
                  value={deviceProcessor}
                  onChange={(event) => setDeviceProcessor(event.target.value)}
                  placeholder="Processeur"
                />
                <Input
                  value={deviceImei}
                  onChange={(event) => setDeviceImei(event.target.value)}
                  placeholder="IMEI"
                />
                <Input
                  value={deviceSerial}
                  onChange={(event) => setDeviceSerial(event.target.value)}
                  placeholder="Numéro de série"
                />
                <Input
                  value={deviceOs}
                  onChange={(event) => setDeviceOs(event.target.value)}
                  placeholder="Version OS"
                />
              </div>
            ) : (
              <DeviceCatalogPicker
                shopId={shopId}
                category={activityType === "computer" ? "laptop" : "smartphone"}
                onSelect={setCatalogDevice}
                onFreeEntry={() => setDeviceMode("free")}
              />
            )}
            {devicePhoto ? (
              <img
                src={devicePhoto}
                alt={deviceModel}
                className="size-24 rounded-md border object-cover"
              />
            ) : null}
          </div>
        )}
        {!isConsumable ? (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Emplacement physique</label>
            <StorageLocationSelect
              shopId={shopId}
              value={location?.id}
              onSelect={setLocation}
            />
          </div>
        ) : null}
        {!isConsumable ? (
          <>
            <Input name="device_processor" placeholder="Processeur" />
            <Input name="device_imei" placeholder="IMEI" />
            <Input name="device_sn" placeholder="Numéro de série" />
            <label className="grid gap-2 text-sm font-medium">
              Problème constaté
              <select
                value={issue}
                onChange={(event) => setIssue(event.target.value as IssueKey)}
                className="h-10 rounded-md border bg-background px-3"
              >
                {Object.entries(ISSUES_DATABASE).map(([key, definition]) => (
                  <option key={key} value={key}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <Input name="notes" placeholder="Notes" />
        <Button type="submit">💾 Enregistrer</Button>
      </form>
      <QuickCreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        shopId={shopId ?? ""}
        onCreated={selectClient}
      />
    </section>
  );
}

export function ActivityDetailsPage({
  activityType,
  id,
}: {
  activityType: ActivityType;
  id: string;
}) {
  const [ticket, setTicket] = useState<WorkshopTicket | null>(null);
  useEffect(() => {
    void getTicketById(id, activityType).then(setTicket);
  }, [activityType, id]);
  if (!ticket) return <p className="text-muted-foreground">Chargement…</p>;
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold">{ticket.device_model}</h1>
      <Card>
        <CardContent className="space-y-2 p-5">
          <p>{ticket.client_name}</p>
          <p>{ticket.client_whatsapp}</p>
          <p>{ticket.notes}</p>
          <Badge>{statusLabels[ticket.status]}</Badge>
        </CardContent>
      </Card>
    </section>
  );
}

export function ActivityHistoryPage({ activityType }: { activityType: ActivityType }) {
  return <ActivityListPage activityType={activityType} history />;
}

export function ExperienceBookPage({
  activityType,
}: {
  activityType: Exclude<ActivityType, "consumable">;
}) {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold">
        Carnet d'expérience {activityLabels[activityType].noun}
      </h1>
      <p className="text-muted-foreground">Module en construction.</p>
    </section>
  );
}
