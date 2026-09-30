import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Laptop, Package, Search, Smartphone, UserRound, Wrench } from "lucide-react";
import { toast } from "sonner";

import { DeviceCatalogPicker, type CatalogDevice } from "@/components/DeviceCatalogPicker";
import { EmptyState } from "@/components/EmptyState";
import { PageHero } from "@/components/PageHero";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { DeviceSelect } from "@/components/selects/DeviceSelect";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
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

const statusStyles: Record<WorkshopTicket["status"], string> = {
  en_attente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  en_cours: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  termine: "bg-green-100 text-green-800 hover:bg-green-100",
  livre: "bg-green-600 text-white hover:bg-green-600",
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
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const labels = activityLabels[activityType];
  const basePath = activityType === "consumable" ? "/consumable/stock" : `/${activityType}/atelier`;
  const heroIcon = activityType === "phone" ? Smartphone : activityType === "computer" ? Laptop : Package;
  const heroColor = activityType === "consumable" ? "green" : "orange";
  const breadcrumb = history
    ? [
        { label: "Accueil", to: "/" },
        { label: activityType === "consumable" ? "Consommables" : activityType === "phone" ? "Téléphone" : "Ordinateur" },
        { label: "Historiques" },
      ]
    : [
        { label: "Accueil", to: "/" },
        { label: activityType === "consumable" ? "Consommables" : activityType === "phone" ? "Téléphone" : "Ordinateur" },
        { label: activityType === "consumable" ? "Stock" : "Atelier" },
      ];
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "tous" && ticket.status !== statusFilter) return false;
    const query = search.trim().toLocaleLowerCase();
    if (
      query &&
      ![ticket.client_name, ticket.client_whatsapp, ticket.device_model]
        .some((value) => value.toLocaleLowerCase().includes(query))
    ) return false;
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
      <PageHero
        title={history ? "Historiques" : activityType === "consumable" ? "Stock" : "Atelier"}
        subtitle={history ? `Historique des fiches ${labels.noun}.` : `Liste des fiches ${labels.noun} de l'atelier.`}
        icon={heroIcon}
        iconColor={heroColor}
        action={
          !history ? (
            <Button
              onClick={() => void navigate({ to: `${basePath}/nouveau` })}
              className="h-11 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d active:scale-95"
            >
              + {labels.create}
            </Button>
          ) : undefined
        }
        breadcrumb={breadcrumb}
      />
      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un client ou un appareil"
            aria-label="Rechercher un client ou un appareil"
            className="h-12 rounded-full pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer par statut">
          {[
            ["tous", "Toutes"],
            ["en_attente", "En attente"],
            ["en_cours", "En cours"],
            ["termine", "Terminé"],
            ["livre", "Livré"],
          ].map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
              className={`shrink-0 rounded-full px-4 ${statusFilter === value ? "bg-orange-600 text-white hover:bg-orange-700" : ""}`}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Du
            <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Au
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal" />
          </label>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {!loading && !shopLoading && filteredTickets.length === 0 ? (
        <EmptyState
          icon={heroIcon}
          title="Aucune fiche trouvée"
          description={search ? "Modifiez votre recherche ou les filtres sélectionnés." : "Les nouvelles fiches apparaîtront ici."}
          {...(!history ? { actionLabel: labels.create, onAction: () => void navigate({ to: `${basePath}/nouveau` }) } : {})}
        />
      ) : null}
      <div className="grid gap-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="min-h-20 rounded-xl shadow-sm transition-all duration-300 hover:shadow-3d">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Wrench className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{ticket.device_model}</h3>
                  <p className="truncate text-sm text-muted-foreground">{ticket.client_name} · {ticket.client_whatsapp}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusStyles[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to={`${basePath}/$id`} params={{ id: ticket.id }}>
                    <Eye className="size-4" />
                    Détails
                  </Link>
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
      <PageHero
        title={isConsumable ? "Nouveau produit" : "Nouvelle fiche"}
        subtitle={
          isConsumable
            ? "Ajoutez un produit au stock et suivez sa disponibilité."
            : "Créez une fiche de réparation avec les informations client et le diagnostic."
        }
        icon={isConsumable ? Package : Wrench}
        iconColor={isConsumable ? "green" : "orange"}
        breadcrumb={
          isConsumable
            ? [{ label: "Accueil", to: "/" }, { label: "Consommables", to: "/consumable/stock" }, { label: "Nouveau produit" }]
            : [{ label: "Accueil", to: "/" }, { label: activityType === "phone" ? "Téléphone" : "Ordinateur", to: `/${activityType}/atelier` }, { label: "Nouvelle fiche" }]
        }
      />
      <form
        onSubmit={(event) => void submit(event)}
        className="grid gap-6"
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700"><UserRound className="size-5" /></span>
              <h2 className="text-lg font-semibold">Informations client</h2>
            </div>
            <label className="text-sm font-medium text-slate-700">Client *</label>
            <ClientSelect
              shopId={shopId}
              value={selectedClient?.id}
              selectedClient={selectedClient ?? undefined}
              onSelect={selectClient}
              onCreateNew={() => setCreateClientOpen(true)}
            />
            {selectedClient ? <p className="text-sm text-muted-foreground">WhatsApp : {selectedClient.whatsapp}</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                {isConsumable ? <Package className="size-5" /> : <Smartphone className="size-5" />}
              </span>
              <h2 className="text-lg font-semibold">{isConsumable ? "Informations consommable" : "Informations appareil"}</h2>
            </div>
            {isConsumable ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="category" placeholder="Catégorie" required className="h-12 rounded-xl" />
                <Input name="consumable_name" placeholder="Nom du consommable" required className="h-12 rounded-xl" />
              </div>
            ) : (
              <>
                {knownDevicesExist ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant={deviceMode === "known" ? "default" : "outline"} onClick={() => setDeviceMode("known")} className="h-11 rounded-xl px-4">
                      Réutiliser un appareil existant
                    </Button>
                    <Button type="button" variant={deviceMode === "catalog" ? "default" : "outline"} onClick={() => setDeviceMode("catalog")} className="h-11 rounded-xl px-4">
                      Catalogue
                    </Button>
                  </div>
                ) : null}
                {deviceMode === "known" && selectedClient ? (
                  <DeviceSelect shopId={shopId} clientId={selectedClient.id} activityType={activityType} onSelect={setKnownDevice} />
                ) : deviceMode === "free" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={deviceModel} onChange={(event) => setDeviceModel(event.target.value)} placeholder="Marque et modèle" required className="h-12 rounded-xl" />
                    <Input value={deviceProcessor} onChange={(event) => setDeviceProcessor(event.target.value)} placeholder="Processeur" className="h-12 rounded-xl" />
                    <Input value={deviceImei} onChange={(event) => setDeviceImei(event.target.value)} placeholder="IMEI" className="h-12 rounded-xl" />
                    <Input value={deviceSerial} onChange={(event) => setDeviceSerial(event.target.value)} placeholder="Numéro de série" className="h-12 rounded-xl" />
                    <Input value={deviceOs} onChange={(event) => setDeviceOs(event.target.value)} placeholder="Version OS" className="h-12 rounded-xl" />
                  </div>
                ) : (
                  <DeviceCatalogPicker shopId={shopId} category={activityType === "computer" ? "laptop" : "smartphone"} onSelect={setCatalogDevice} onFreeEntry={() => setDeviceMode("free")} />
                )}
                {devicePhoto ? <img src={devicePhoto} alt={deviceModel} className="size-24 rounded-xl border object-cover" /> : null}
              </>
            )}
          </CardContent>
        </Card>

        {!isConsumable ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="grid gap-4 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700"><Package className="size-5" /></span>
                <h2 className="text-lg font-semibold">Emplacement</h2>
              </div>
              <label className="text-sm font-medium text-slate-700">Emplacement physique</label>
              <StorageLocationSelect shopId={shopId} value={location?.id} onSelect={setLocation} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700"><Wrench className="size-5" /></span>
              <h2 className="text-lg font-semibold">{isConsumable ? "Notes" : "Diagnostic"}</h2>
            </div>
            {!isConsumable ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Problème constaté
                <select value={issue} onChange={(event) => setIssue(event.target.value as IssueKey)} className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500">
                  {Object.entries(ISSUES_DATABASE).map(([key, definition]) => <option key={key} value={key}>{definition.label}</option>)}
                </select>
              </label>
            ) : null}
            <Input name="notes" placeholder="Notes complémentaires" className="h-12 rounded-xl" />
          </CardContent>
        </Card>

        <Button type="submit" className="sticky bottom-4 z-10 h-12 w-full rounded-xl bg-ivoirien px-8 font-semibold shadow-3d active:scale-95 sm:justify-self-end">
          Enregistrer la fiche
        </Button>
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
      <PageHero
        title={ticket.device_model}
        subtitle="Détails de la fiche et suivi de l'intervention."
        icon={activityType === "phone" ? Smartphone : activityType === "computer" ? Laptop : Package}
        iconColor={activityType === "consumable" ? "green" : "orange"}
        breadcrumb={
          activityType === "consumable"
            ? [{ label: "Accueil", to: "/" }, { label: "Consommables", to: "/consumable/stock" }, { label: "Produit" }]
            : [{ label: "Accueil", to: "/" }, { label: activityType === "phone" ? "Téléphone" : "Ordinateur", to: `/${activityType}/atelier` }, { label: "Fiche" }]
        }
      />
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
      <PageHero
        title="Carnet d'expérience"
        subtitle={`Historique et notes de travail pour le ${activityLabels[activityType].noun}.`}
        icon={activityType === "phone" ? Smartphone : Laptop}
        iconColor="blue"
        breadcrumb={
          activityType === "phone"
            ? [{ label: "Accueil", to: "/" }, { label: "Téléphone" }, { label: "Carnet d'expérience" }]
            : [{ label: "Accueil", to: "/" }, { label: "Ordinateur" }, { label: "Carnet d'expérience" }]
        }
      />
      <p className="text-muted-foreground">Module en construction.</p>
    </section>
  );
}
