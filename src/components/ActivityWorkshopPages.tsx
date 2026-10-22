import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Laptop,
  Package,
  Plus,
  Printer,
  Search,
  Smartphone,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { DeviceCatalogPicker, type CatalogDevice } from "@/components/DeviceCatalogPicker";
import { EmptyState } from "@/components/EmptyState";
import { PageHero } from "@/components/PageHero";
import { AddPartDialog, type ConsumedPart } from "@/components/AddPartDialog";
import { QuickCreateStaffDialog } from "@/components/QuickCreateStaffDialog";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { DeviceSelect } from "@/components/selects/DeviceSelect";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { StorageLocationDialog } from "@/components/StorageLocationDialog";
import { WorkshopPaymentModal } from "@/components/WorkshopPaymentModal";
import { MemberSelect, type MemberOption } from "@/components/selects/MemberSelect";
import {
  WorkshopTicketPreview,
  type WorkshopTicketPreviewAudience,
  type WorkshopTicketPreviewMode,
} from "@/components/WorkshopTicketPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import {
  assignTicketToLocation,
  freeLocation,
  getLocationByTicketId,
  type StorageLocation,
} from "@/services/storageService";
import { searchDevices, type KnownDevice } from "@/services/workshopService";
import { getClientById, type ClientRecord } from "@/services/clientService";
import { getTeamMembers } from "@/services/teamService";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { getEvents, addEvent, createWorkshopPayment, updateWorkshopTicket } from "@/services/workshopService";
import { WorkshopTimeline } from "@/components/WorkshopTimeline";
import {
  createTicket,
  generateDiagnosis,
  getTicketById,
  getTickets,
  COMPUTER_ISSUE_KEYS,
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
  diagnostique: "🔎 Diagnostiqué",
  en_cours: "⚙️ En cours",
  termine: "✅ Terminé",
  livre: "📦 Livré",
};

const statusStyles: Record<WorkshopTicket["status"], string> = {
  en_attente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  diagnostique: "bg-violet-100 text-violet-800 hover:bg-violet-100",
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
  const heroIcon =
    activityType === "phone" ? Smartphone : activityType === "computer" ? Laptop : Package;
  const heroColor = activityType === "consumable" ? "green" : "orange";
  const breadcrumb = history
    ? [
        { label: "Accueil", to: "/dashboard" },
        {
          label:
            activityType === "consumable"
              ? "Consommables"
              : activityType === "phone"
                ? "Téléphone"
                : "Ordinateur",
        },
        { label: "Historiques" },
      ]
    : [
        { label: "Accueil", to: "/dashboard" },
        {
          label:
            activityType === "consumable"
              ? "Consommables"
              : activityType === "phone"
                ? "Téléphone"
                : "Ordinateur",
        },
        { label: activityType === "consumable" ? "Stock" : "Atelier" },
      ];
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "tous" && ticket.status !== statusFilter) return false;
    const query = search.trim().toLocaleLowerCase();
    if (
      query &&
      ![ticket.client_name, ticket.client_whatsapp, ticket.device_model ?? ""].some((value) =>
        String(value ?? "")
          .toLocaleLowerCase()
          .includes(query),
      )
    )
      return false;
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

  const statusOptions: Array<[string, string]> = [
    ["tous", "Toutes"],
    ["en_attente", "En attente"],
    ["diagnostique", "Diagnostiqué"],
    ["en_cours", "En cours"],
    ["termine", "Terminé"],
    ["livre", "Livré"],
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title={history ? "Historiques" : activityType === "consumable" ? "Stock" : "Atelier"}
        subtitle={
          history
            ? `Historique des fiches ${labels.noun}.`
            : `Liste des fiches ${labels.noun} de l'atelier.`
        }
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
          {statusOptions.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value ?? "tous")}
              className={`shrink-0 rounded-full px-4 ${statusFilter === value ? "bg-orange-600 text-white hover:bg-orange-700" : ""}`}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Du
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-xl border bg-background px-3 font-normal"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Au
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-xl border bg-background px-3 font-normal"
            />
          </label>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading || shopLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {!loading && !shopLoading && filteredTickets.length === 0 ? (
        <EmptyState
          icon={heroIcon}
          title="Aucune fiche trouvée"
          description={
            search
              ? "Modifiez votre recherche ou les filtres sélectionnés."
              : "Les nouvelles fiches apparaîtront ici."
          }
          {...(!history
            ? {
                actionLabel: labels.create,
                onAction: () => void navigate({ to: `${basePath}/nouveau` }),
              }
            : {})}
        />
      ) : null}
      <div className="grid gap-3">
        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="min-h-20 rounded-xl shadow-sm transition-all duration-300 hover:shadow-3d"
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Wrench className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {ticket.device_model ?? "Fiche technique"}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {ticket.client_name} · {ticket.client_whatsapp}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusStyles[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    void navigate({
                      to:
                        activityType === "consumable"
                          ? "/consumable/stock/$id"
                          : `/${activityType}/atelier/$id`,
                      params: { id: ticket.id },
                    })
                  }
                >
                  <Eye className="size-4" />
                  Détails
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
  if (activityType !== "consumable") return <NewWorkshopTicketPage activityType={activityType} />;
  return <ExistingNewActivityPage activityType={activityType} />;
}

function ExistingNewActivityPage({ activityType }: { activityType: ActivityType }) {
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
  const [createLocationOpen, setCreateLocationOpen] = useState(false);
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
  const [locationRefreshKey, setLocationRefreshKey] = useState(0);
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

  function handleClientCreated(client: ClientRecord) {
    selectClient(client);
    setClientRefreshKey((current) => current + 1);
  }

  function setCatalogDevice(device: CatalogDevice) {
    setDeviceModel(device.model);
    setDeviceProcessor(device.processor ?? "");
    setDeviceImei("");
    setDeviceSerial("");
    setDeviceOs(device.os ?? "");
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
      toast.error(
        isConsumable ? "Saisissez le nom du consommable." : "Sélectionnez ou saisissez un modèle.",
      );
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
            ? [
                { label: "Accueil", to: "/dashboard" },
                { label: "Consommables", to: "/consumable/stock" },
                { label: "Nouveau produit" },
              ]
            : [
                { label: "Accueil", to: "/dashboard" },
                {
                  label: activityType === "phone" ? "Téléphone" : "Ordinateur",
                  to: `/${activityType}/atelier`,
                },
                { label: "Nouvelle fiche" },
              ]
        }
      />
      <form onSubmit={(event) => void submit(event)} className="grid gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <UserRound className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">Informations client</h2>
            </div>
            <label className="text-sm font-medium text-slate-700">Client *</label>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ClientSelect
                  shopId={shopId}
                  refreshKey={clientRefreshKey}
                  value={selectedClient?.id}
                  selectedClient={selectedClient ?? undefined}
                  onSelect={selectClient}
                  onCreateNew={() => setCreateClientOpen(true)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Créer un client"
                title="Créer un client"
                disabled={!shopId}
                onClick={() => setCreateClientOpen(true)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {selectedClient ? (
              <p className="text-sm text-muted-foreground">WhatsApp : {selectedClient.whatsapp}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                {isConsumable ? <Package className="size-5" /> : <Smartphone className="size-5" />}
              </span>
              <h2 className="text-lg font-semibold">
                {isConsumable ? "Informations consommable" : "Informations appareil"}
              </h2>
            </div>
            {isConsumable ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="category"
                  placeholder="Catégorie"
                  required
                  className="h-12 rounded-xl"
                />
                <Input
                  name="consumable_name"
                  placeholder="Nom du consommable"
                  required
                  className="h-12 rounded-xl"
                />
              </div>
            ) : (
              <>
                {knownDevicesExist ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={deviceMode === "known" ? "default" : "outline"}
                      onClick={() => setDeviceMode("known")}
                      className="h-11 rounded-xl px-4"
                    >
                      Réutiliser un appareil existant
                    </Button>
                    <Button
                      type="button"
                      variant={deviceMode === "catalog" ? "default" : "outline"}
                      onClick={() => setDeviceMode("catalog")}
                      className="h-11 rounded-xl px-4"
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
                      className="h-12 rounded-xl"
                    />
                    <Input
                      value={deviceProcessor}
                      onChange={(event) => setDeviceProcessor(event.target.value)}
                      placeholder="Processeur"
                      className="h-12 rounded-xl"
                    />
                    <Input
                      value={deviceImei}
                      onChange={(event) => setDeviceImei(event.target.value)}
                      placeholder="IMEI"
                      className="h-12 rounded-xl"
                    />
                    <Input
                      value={deviceSerial}
                      onChange={(event) => setDeviceSerial(event.target.value)}
                      placeholder="Numéro de série"
                      className="h-12 rounded-xl"
                    />
                    <Input
                      value={deviceOs}
                      onChange={(event) => setDeviceOs(event.target.value)}
                      placeholder="Version OS"
                      className="h-12 rounded-xl"
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
                    className="size-24 rounded-xl border object-cover"
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {!isConsumable ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="grid gap-4 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Package className="size-5" />
                </span>
                <h2 className="text-lg font-semibold">Emplacement</h2>
              </div>
              <label className="text-sm font-medium text-slate-700">Emplacement physique</label>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <StorageLocationSelect
                    key={`${shopId}:${locationRefreshKey}`}
                    shopId={shopId}
                    value={location?.id}
                    onSelect={setLocation}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Créer un emplacement"
                  title="Créer un emplacement"
                  disabled={!shopId}
                  onClick={() => setCreateLocationOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="grid gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <Wrench className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{isConsumable ? "Notes" : "Diagnostic"}</h2>
            </div>
            {!isConsumable ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Problème constaté
                <select
                  value={issue}
                  onChange={(event) => setIssue(event.target.value as IssueKey)}
                  className="h-12 rounded-xl border-2 bg-background px-3 focus:border-orange-500"
                >
                  {Object.entries(ISSUES_DATABASE).map(([key, definition]) => (
                    <option key={key} value={key}>
                      {definition.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Input name="notes" placeholder="Notes complémentaires" className="h-12 rounded-xl" />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="sticky bottom-4 z-10 h-12 w-full rounded-xl bg-ivoirien px-8 font-semibold shadow-3d active:scale-95 sm:justify-self-end"
        >
          Enregistrer la fiche
        </Button>
      </form>
      <QuickCreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        shopId={shopId ?? ""}
        onCreated={handleClientCreated}
      />
      {shopId ? (
        <StorageLocationDialog
          open={createLocationOpen}
          onOpenChange={setCreateLocationOpen}
          shopId={shopId}
          onSaved={(createdLocation) => {
            setLocation(createdLocation);
            setLocationRefreshKey((current) => current + 1);
          }}
        />
      ) : null}
    </section>
  );
}

function NewWorkshopTicketPage({
  activityType,
}: {
  activityType: Exclude<ActivityType, "consumable">;
}) {
  const navigate = useNavigate();
  const { shopId } = useCurrentShop();
  const [initialClientId] = useState(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("clientId"),
  );
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createLocationOpen, setCreateLocationOpen] = useState(false);
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
  const [locationRefreshKey, setLocationRefreshKey] = useState(0);
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceProcessor, setDeviceProcessor] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [deviceOs, setDeviceOs] = useState("");
  const [devicePhoto, setDevicePhoto] = useState<string | null>(null);
  const [knownDevicesExist, setKnownDevicesExist] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"catalog" | "known" | "free">("catalog");
  const [issues, setIssues] = useState<IssueKey[]>([
    activityType === "computer" ? "pc_ecran_casse" : "ecran_casse",
  ]);
  const [description, setDescription] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [entryPayment, setEntryPayment] = useState<{ method: string; amount: number } | null>(
    null,
  );
  const [location, setLocation] = useState<StorageLocation | null>(null);
  const [technician, setTechnician] = useState<MemberOption | null>(null);
  const [technicianAvatarUrl, setTechnicianAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<WorkshopTicket | null>(null);
  const [createdAt] = useState(() => new Date());
  const createdAtLabel = createdAt.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const issueOptions = Object.entries(ISSUES_DATABASE).filter(([key]) =>
    activityType === "computer"
      ? COMPUTER_ISSUE_KEYS.includes(key as IssueKey)
      : !COMPUTER_ISSUE_KEYS.includes(key as IssueKey),
  );
  const devicePlaceholders =
    activityType === "computer"
      ? {
          brand: "DELL, HP, Lenovo, Asus, Acer, Apple...",
          model: "Latitude, EliteBook, ThinkPad...",
          os: "Windows 11, macOS Sonoma...",
          serial: "Numéro de série du PC",
          serialLabel: "Numéro de série",
        }
      : {
          brand: "Ex. Samsung",
          model: "Ex. Galaxy A15",
          os: "Optionnel",
          serial: "Optionnel",
          serialLabel: "IMEI",
        };

  useEffect(() => {
    if (!shopId || !initialClientId) return;
    let active = true;
    void getClientById(initialClientId)
      .then((client) => {
        if (!active || !client || client.shop_id !== shopId) return;
        setSelectedClient(client);
        setClientName(client.full_name);
        setClientWhatsapp(client.whatsapp);
        void searchDevices(shopId, "", activityType, client.id)
          .then((devices) => {
            if (active) setKnownDevicesExist(devices.length > 0);
          })
          .catch((error: unknown) => {
            console.error("[ActivityWorkshopPages] known devices:", error);
            if (active) setKnownDevicesExist(false);
          });
      })
      .catch((error: unknown) => {
        console.error("[ActivityWorkshopPages] initial client:", error);
      });
    return () => {
      active = false;
    };
  }, [activityType, initialClientId, shopId]);

  function selectClient(client: ClientRecord) {
    setSelectedClient(client);
    setClientName(client.full_name);
    setClientWhatsapp(client.whatsapp);
    setKnownDevicesExist(false);
    setDeviceMode("catalog");
    if (!shopId) return;
    void searchDevices(shopId, "", activityType, client.id)
      .then((devices) => setKnownDevicesExist(devices.length > 0))
      .catch((error: unknown) => {
        console.error("[ActivityWorkshopPages] known devices:", error);
        setKnownDevicesExist(false);
      });
  }

  function setCatalogDevice(device: CatalogDevice) {
    setDeviceBrand(device.brand);
    setDeviceModel(device.model);
    setDeviceProcessor(device.processor ?? "");
    setDeviceImei("");
    setDeviceSerial("");
    setDeviceOs(device.os ?? "");
    setDevicePhoto(device.imageUrl);
  }

  function setKnownDevice(device: KnownDevice) {
    const [brand, ...modelParts] = device.device_model.split(" ");
    setDeviceBrand(brand ?? "");
    setDeviceModel(modelParts.join(" ") || device.device_model);
    setDeviceProcessor(device.device_processor ?? "");
    setDeviceImei(device.device_imei ?? "");
    setDeviceSerial(device.device_sn ?? "");
    setDeviceOs(device.device_os_version ?? "");
    setDevicePhoto(null);
  }

  function goToNextStep() {
    if (step === 1) {
      if (!selectedClient) {
        toast.error("Sélectionnez un client avant de continuer.");
        return;
      }
      if (!clientName.trim() || clientWhatsapp.replace(/\D/g, "").length < 8) {
        toast.error("Vérifiez le nom et le numéro WhatsApp du client.");
        return;
      }
    }
    if (step === 2 && (!deviceBrand.trim() || !deviceModel.trim())) {
      toast.error("Saisissez la marque et le modèle de l'appareil.");
      return;
    }
    if (step === 3 && issues.length === 0) {
      toast.error("Sélectionnez au moins une panne constatée.");
      return;
    }
    setStep((current) => Math.min(current + 1, 5));
  }

  async function submitTicket() {
    if (!shopId || !selectedClient) {
      toast.error("Sélectionnez un atelier et un client avant de créer la fiche.");
      return;
    }
    setSaving(true);
    try {
      const ticket = await createTicket({
        shop_id: shopId,
        activity_type: activityType,
        client_id: selectedClient.id,
        client_name: clientName.trim(),
        client_whatsapp: clientWhatsapp.trim(),
        device_brand: deviceBrand.trim(),
        device_model: deviceModel.trim(),
        device_processor: deviceProcessor,
        device_imei: deviceImei.trim(),
        device_sn: deviceSerial.trim(),
        device_os_version: deviceOs.trim(),
        issues,
        diagnosis: generateDiagnosis(issues),
        description: description.trim(),
        notes: description.trim(),
        entry_fee: entryPayment?.amount ?? 2000,
        entry_fee_paid: Boolean(entryPayment),
        entry_fee_method: entryPayment?.method ?? "cash",
        technicien_id: technician?.user_id,
        storage_location_id: location?.id,
      });
      setCreatedTicket(ticket);
      toast.success("Fiche créée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la fiche.");
    } finally {
      setSaving(false);
    }
  }

  const steps = ["Client", "Appareil", "Problème", "Paiement", "Rangement"];

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHero
        title="Nouvelle fiche de réparation"
        subtitle="Enregistrez la réception de l'appareil en cinq étapes."
        icon={activityType === "phone" ? Smartphone : Laptop}
        iconColor="orange"
        breadcrumb={[
          { label: "Accueil", to: "/dashboard" },
          {
            label: activityType === "phone" ? "Téléphone" : "Ordinateur",
            to: `/${activityType}/atelier`,
          },
          { label: "Nouvelle fiche" },
        ]}
      />
      <div className="grid grid-cols-5 gap-2" aria-label="Étapes de création">
        {steps.map((label, index) => {
          const number = index + 1;
          return (
            <div
              key={label}
              aria-current={step === number ? "step" : undefined}
              className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold sm:text-sm ${
                step === number
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : step > number
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "bg-card text-muted-foreground"
              }`}
            >
              <span className="mr-1">{number}.</span>
              {label}
            </div>
          );
        })}
      </div>

      <Card className="card-3d rounded-2xl shadow-3d">
        <CardContent className="grid gap-5 p-5 sm:p-6">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-3">
                <UserRound className="size-5 text-orange-700" />
                <h2 className="text-lg font-semibold">Client</h2>
              </div>
              <div className="flex items-end gap-2">
                <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium">
                  Client
                  <ClientSelect
                    shopId={shopId}
                    refreshKey={clientRefreshKey}
                    value={selectedClient?.id}
                    selectedClient={selectedClient ?? undefined}
                    onSelect={selectClient}
                    onCreateNew={() => setCreateClientOpen(true)}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Créer un client"
                  title="Créer un client"
                  disabled={!shopId}
                  onClick={() => setCreateClientOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Nom / pseudo
                <Input
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                WhatsApp
                <Input
                  value={clientWhatsapp}
                  onChange={(event) => setClientWhatsapp(event.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </label>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4" />
                Réception : {createdAtLabel}
              </p>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="flex items-center gap-3">
                {activityType === "phone" ? (
                  <Smartphone className="size-5 text-green-700" />
                ) : (
                  <Laptop className="size-5 text-green-700" />
                )}
                <h2 className="text-lg font-semibold">Appareil</h2>
              </div>
              {knownDevicesExist ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={deviceMode === "known" ? "default" : "outline"}
                    onClick={() => setDeviceMode("known")}
                  >
                    Appareil déjà enregistré
                  </Button>
                  <Button
                    type="button"
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
              ) : deviceMode === "catalog" ? (
                <DeviceCatalogPicker
                  shopId={shopId}
                  category={activityType === "computer" ? "laptop" : "smartphone"}
                  onSelect={setCatalogDevice}
                  onFreeEntry={() => setDeviceMode("free")}
                />
              ) : (
                <Button type="button" variant="outline" onClick={() => setDeviceMode("catalog")}>
                  Choisir un modèle du catalogue
                </Button>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Marque
                  <Input
                    value={deviceBrand}
                    onChange={(event) => setDeviceBrand(event.target.value)}
                    placeholder={devicePlaceholders.brand}
                    className="h-12 rounded-xl"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Modèle
                  <Input
                    value={deviceModel}
                    onChange={(event) => setDeviceModel(event.target.value)}
                    placeholder={devicePlaceholders.model}
                    className="h-12 rounded-xl"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Version OS
                  <Input
                    value={deviceOs}
                    onChange={(event) => setDeviceOs(event.target.value)}
                    placeholder={devicePlaceholders.os}
                    className="h-12 rounded-xl"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {devicePlaceholders.serialLabel}
                  <Input
                    value={activityType === "computer" ? deviceSerial : deviceImei}
                    onChange={(event) =>
                      activityType === "computer"
                        ? setDeviceSerial(event.target.value)
                        : setDeviceImei(event.target.value)
                    }
                    placeholder={devicePlaceholders.serial}
                    className="h-12 rounded-xl"
                  />
                </label>
              </div>
              {devicePhoto ? (
                <img
                  src={devicePhoto}
                  alt={`${deviceBrand} ${deviceModel}`}
                  className="size-24 rounded-xl border object-cover"
                />
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="flex items-center gap-3">
                <Wrench className="size-5 text-orange-700" />
                <h2 className="text-lg font-semibold">Problème constaté</h2>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Description libre
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Décrivez les symptômes et les circonstances..."
                  rows={4}
                />
              </label>
              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold">Pannes prédéfinies</legend>
                {issueOptions.map(([key, issue]) => {
                  const issueKey = key as IssueKey;
                  return (
                    <label
                      key={issueKey}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={issues.includes(issueKey)}
                        onChange={(event) =>
                          setIssues((current) =>
                            event.target.checked
                              ? [...current, issueKey]
                              : current.filter((value) => value !== issueKey),
                          )
                        }
                        className="size-4 accent-orange-600"
                      />
                      {issue.label}
                    </label>
                  );
                })}
              </fieldset>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-700" />
                <h2 className="text-lg font-semibold">Paiement d'entrée</h2>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-slate-900">
                <p className="font-semibold">Frais d'entrée : 2 000 FCFA</p>
                <p className="mt-1 text-sm text-slate-700">Non remboursable.</p>
                {entryPayment ? (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    Payé · {entryPayment.method} ·{" "}
                    {new Intl.NumberFormat("fr-FR").format(entryPayment.amount)} FCFA
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-700">Paiement non enregistré.</p>
                )}
              </div>
              <Button
                type="button"
                className="w-full bg-ivoirien bg-ivoirien-hover shadow-3d"
                onClick={() => setPaymentOpen(true)}
              >
                {entryPayment ? "Modifier le paiement" : "Encaisser"}
              </Button>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <div className="flex items-center gap-3">
                <Package className="size-5 text-green-700" />
                <h2 className="text-lg font-semibold">Rangement et validation</h2>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Casier (facultatif)</label>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <StorageLocationSelect
                      key={`${shopId}:${locationRefreshKey}`}
                      shopId={shopId}
                      value={location?.id}
                      onSelect={setLocation}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Créer un emplacement"
                    title="Créer un emplacement"
                    disabled={!shopId}
                    onClick={() => setCreateLocationOpen(true)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Technicien (facultatif)</label>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <MemberSelect
                      shopId={shopId}
                      refreshKey={memberRefreshKey}
                      selectedUserId={technician?.user_id}
                      filterRoles={["technicien", "technicien_pc", "manager"]}
                      onSelect={setTechnician}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Ajouter un employé"
                    title="Ajouter un employé"
                    disabled={!shopId}
                    onClick={() => setCreateStaffOpen(true)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {technician ? (
                  <p className="text-sm text-muted-foreground">Affecté à {technician.name}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                <h3 className="mb-2 font-semibold">Récapitulatif</h3>
                <p>Client : {clientName || "—"} · {clientWhatsapp || "—"}</p>
                <p>
                  Appareil : {deviceBrand} {deviceModel}
                </p>
                <p>Pannes : {issues.map((key) => ISSUES_DATABASE[key].label).join(", ") || "—"}</p>
                <p>Frais d'entrée : {entryPayment ? `${entryPayment.amount} FCFA (payé)` : "non payé"}</p>
                <p>Emplacement : {location?.name ?? "Non attribué"}</p>
              </div>
            </>
          ) : null}

          <div className="flex justify-between gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || saving}
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
            >
              Précédent
            </Button>
            {step < 5 ? (
              <Button
                type="button"
                className="bg-ivoirien bg-ivoirien-hover shadow-3d"
                onClick={goToNextStep}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saving}
                className="bg-ivoirien bg-ivoirien-hover shadow-3d"
                onClick={() => void submitTicket()}
              >
                {saving ? "Création…" : "Créer la fiche et générer le ticket"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <QuickCreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        shopId={shopId ?? ""}
        onCreated={(client) => {
          selectClient(client);
          setClientRefreshKey((current) => current + 1);
        }}
      />
      {shopId ? (
        <QuickCreateStaffDialog
          open={createStaffOpen}
          onClose={() => setCreateStaffOpen(false)}
          shopId={shopId}
          defaultRole="technicien"
          onSuccess={(staff) => {
            setTechnician({
              user_id: staff.user_id ?? staff.id,
              role: staff.role,
              name: staff.full_name ?? "Sans nom",
            });
            setMemberRefreshKey((key) => key + 1);
          }}
        />
      ) : null}
      {shopId ? (
        <StorageLocationDialog
          open={createLocationOpen}
          onOpenChange={setCreateLocationOpen}
          shopId={shopId}
          onSaved={(createdLocation) => {
            setLocation(createdLocation);
            setLocationRefreshKey((current) => current + 1);
          }}
        />
      ) : null}
      <WorkshopPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={2000}
        title="Encaisser frais d'entrée"
        onSuccess={(method, amount) => setEntryPayment({ method, amount })}
      />
      <Dialog open={Boolean(createdTicket)} onOpenChange={() => undefined}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket de réception créé</DialogTitle>
            <DialogDescription>
              Le numéro de ticket peut être imprimé ou consulté dans la fiche.
            </DialogDescription>
          </DialogHeader>
          {createdTicket ? (
            <>
              <style>{`@media print { body * { visibility: hidden !important; } .workshop-print-ticket, .workshop-print-ticket * { visibility: visible !important; } .workshop-print-ticket { position: fixed; inset: 0; padding: 2rem; background: white; color: black; } }`}</style>
              <div className="workshop-print-ticket rounded-xl border p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                  GogoSoft · Réception atelier
                </p>
                <p className="my-3 text-3xl font-bold">
                  {createdTicket.ticket_number ?? createdTicket.id}
                </p>
                <p>{createdTicket.client_name} · {createdTicket.client_whatsapp}</p>
                <p className="mt-1">
                  {createdTicket.device_brand} {createdTicket.device_model}
                </p>
                <p className="mt-1 text-sm">
                  {createdTicket.issues.map((key) => ISSUES_DATABASE[key as IssueKey]?.label ?? key).join(", ")}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">{createdAtLabel}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 size-4" />
                  Imprimer
                </Button>
                <Button
                  type="button"
                  className="bg-ivoirien bg-ivoirien-hover shadow-3d"
                  onClick={() =>
                    void navigate({
                      to:
                        activityType === "phone"
                          ? "/phone/atelier/$id"
                          : "/computer/atelier/$id",
                      params: { id: createdTicket.id },
                    })
                  }
                >
                  Ouvrir la fiche
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function defaultPickupDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function pickupDateFromDescription(description: string): string | null {
  const match = description.match(/Retrait estimé\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function estimateAmountFromDescription(description: string, label: string): number | null {
  const match = description.match(
    new RegExp(`${label}\\s*:\\s*([\\d\\s\\u00a0\\u202f]+)\\s*FCFA`, "i"),
  );
  if (!match) return null;
  const captured = match[1];
  if (!captured) return null;
  const amount = Number(captured.replace(/[\s\u00a0\u202f]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

export function ActivityDetailsPage({
  activityType,
  id,
}: {
  activityType: ActivityType;
  id: string;
}) {
  const { shopId, shop } = useCurrentShop();
  const [ticket, setTicket] = useState<WorkshopTicket | null>(null);
  const [events, setEvents] = useState<Awaited<ReturnType<typeof getEvents>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [diagnostic, setDiagnostic] = useState("");
  const [duration, setDuration] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [pickupDate, setPickupDate] = useState(defaultPickupDate);
  const [technician, setTechnician] = useState<MemberOption | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);
  const [tools, setTools] = useState("");
  const [pieces, setPieces] = useState<ConsumedPart[]>([]);
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<WorkshopTicketPreviewMode | null>(null);
  const [previewAudience, setPreviewAudience] =
    useState<WorkshopTicketPreviewAudience>("internal");
  const [diagnosticEventDescription, setDiagnosticEventDescription] = useState("");
  const estimateTotal =
    (Number(laborCost) || 0) + (Number(partsCost) || 0) + (Number(otherCost) || 0);
  const entryPaid = ticket?.entry_fee_paid ? (ticket.entry_fee ?? 2000) : 0;
  const remainingAmount = Math.max(0, (ticket?.price_estimate ?? 0) - entryPaid);

  useEffect(() => {
    let active = true;
    setError(null);
    void getTicketById(id, activityType)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setError("Fiche atelier introuvable.");
          return;
        }
        setTicket(result);
        setTechnician(null);
        setTechnicianAvatarUrl(null);
        if (result.technicien_id) {
          if (shopId) {
            void getTeamMembers(shopId).then((members) => {
              if (active) {
                setTechnicianAvatarUrl(
                  members.find((member) => member.user_id === result.technicien_id)?.avatar_url ?? null,
                );
              }
            }).catch(() => {
              if (active) setTechnicianAvatarUrl(null);
            });
          }
          void supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", result.technicien_id)
            .maybeSingle()
            .then(
              ({ data, error: profileError }) => {
                if (profileError) {
                  if (active) toast.error(profileError.message);
                  return;
                }
                if (active && data) {
                  setTechnician({
                    user_id: data.id,
                    role: "technicien",
                    name: data.full_name || data.email || data.id.slice(0, 8),
                  });
                }
              },
              (reason: unknown) => {
                if (active) {
                  toast.error(reason instanceof Error ? reason.message : "Technicien introuvable.");
                }
              },
            );
        }
        setDiagnostic(result.diagnostic_notes ?? "");
        setDuration("");
        setLaborCost(String(result.price_estimate ?? ""));
        setPartsCost("");
        setOtherCost("");
        setPickupDate(defaultPickupDate());
        setTools((result.outils_utilises ?? []).join(", "));
        setPieces(result.pieces_consommees ?? []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Chargement impossible.");
      });
    void getEvents(id)
      .then((result) => {
        if (active) {
          setEvents(result);
          const latestEstimate =
            [...result].reverse().find((event) => event.event_type === "diagnosed")?.description ?? "";
          setDiagnosticEventDescription(latestEstimate);
          const savedPickupDate = pickupDateFromDescription(latestEstimate);
          if (savedPickupDate) setPickupDate(savedPickupDate);
          const savedLaborCost = estimateAmountFromDescription(latestEstimate, "Main d'œuvre");
          const savedPartsCost = estimateAmountFromDescription(latestEstimate, "pièces");
          const savedOtherCost = estimateAmountFromDescription(latestEstimate, "divers");
          if (savedLaborCost !== null) setLaborCost(String(savedLaborCost));
          if (savedPartsCost !== null) setPartsCost(String(savedPartsCost));
          if (savedOtherCost !== null) setOtherCost(String(savedOtherCost));
        }
      })
      .catch((reason: unknown) => {
        if (active) toast.error(reason instanceof Error ? reason.message : "Historique indisponible.");
      });
    return () => {
      active = false;
    };
  }, [activityType, id]);

  async function recordUpdate(
    updates: Parameters<typeof updateWorkshopTicket>[1],
    eventType: Parameters<typeof addEvent>[1],
    eventDescription: string,
    successMessage: string,
  ) {
    setBusy(true);
    try {
      await updateWorkshopTicket(id, updates, activityType);
      await addEvent(id, eventType, eventDescription);
      const [refreshedTicket, refreshedEvents] = await Promise.all([
        getTicketById(id, activityType),
        getEvents(id),
      ]);
      if (!refreshedTicket) throw new Error("La fiche mise à jour est introuvable.");
      setTicket(refreshedTicket);
      setEvents(refreshedEvents);
      if (eventType === "diagnosed") setDiagnosticEventDescription(eventDescription);
      toast.success(successMessage);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  }

  function openPreview(
    mode: WorkshopTicketPreviewMode,
    audience: WorkshopTicketPreviewAudience = "internal",
  ) {
    setPreviewAudience(audience);
    setPreviewMode(mode);
  }

  async function validateEstimate() {
    if (!ticket) return;
    const amounts = [laborCost, partsCost, otherCost, duration];
    if (amounts.some((value) => value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      toast.error("Les montants et la durée doivent être des nombres positifs.");
      return;
    }
    const previousDiagnostic = ticket.diagnostic_notes?.trim() ?? "";
    const existingNotes = ticket.notes?.trim() ?? "";
    const baseNotes = previousDiagnostic ? existingNotes.replace(previousDiagnostic, "").trim() : existingNotes;
    const nextNotes = [baseNotes, diagnostic.trim()].filter(Boolean).join("\n\n");
    const dateLabel = pickupDate
      ? new Date(`${pickupDate}T12:00:00`).toLocaleDateString("fr-FR")
      : "à confirmer";
    const durationLabel = duration ? `${duration} h estimée(s)` : "durée non renseignée";
    await recordUpdate(
      {
        price_estimate: estimateTotal,
        status: "diagnostique",
        notes: nextNotes,
        diagnostic_notes: diagnostic.trim(),
        notified_at: null,
      },
      "diagnosed",
      `Diagnostic : ${diagnostic.trim() || "non renseigné"}. ${durationLabel}. Main d'œuvre : ${formatFcfa(Number(laborCost) || 0)}, pièces : ${formatFcfa(Number(partsCost) || 0)}, divers : ${formatFcfa(Number(otherCost) || 0)}, total : ${formatFcfa(estimateTotal)}. Retrait estimé : ${dateLabel}.`,
      "Devis validé.",
    );
  }

  function sendEstimateByWhatsapp() {
    if (!ticket) return;
    const dateLabel = pickupDate
      ? new Date(`${pickupDate}T12:00:00`).toLocaleDateString("fr-FR")
      : "à confirmer";
    const device = [ticket.device_brand, ticket.device_model].filter(Boolean).join(" ");
    const message = `Bonjour ${ticket.client_name ?? ""}, votre ${device} est diagnostiqué. Devis : ${formatFcfa(estimateTotal)}. Retrait estimé : ${dateLabel}. — ${shop?.name ?? "notre atelier"}`;
    window.open(buildWhatsappLink(ticket.client_whatsapp ?? "", message), "_blank", "noopener,noreferrer");
  }

  async function startRepair() {
    if (!technician) {
      toast.error("Sélectionnez le technicien responsable.");
      return;
    }
    await recordUpdate(
      {
        status: "en_cours",
        technicien_id: technician.user_id,
        outils_utilises: tools.split(",").map((tool) => tool.trim()).filter(Boolean),
        pieces_consommees: pieces,
      },
      "in_progress",
      `Réparation démarrée par ${technician.name}.`,
      "Réparation démarrée.",
    );
  }

  async function completeRepair() {
    await recordUpdate(
      {
        status: "termine",
        outils_utilises: tools.split(",").map((tool) => tool.trim()).filter(Boolean),
        pieces_consommees: pieces,
        ...(technician ? { technicien_id: technician.user_id } : {}),
      },
      "completed",
      "Réparation marquée comme terminée.",
      "Réparation terminée, prêt pour retrait.",
    );
  }

  function addConsumedPart(part: ConsumedPart) {
    setPieces((current) => [...current, part]);
  }

  async function finishDelivery(method: string, amount: number) {
    if (!ticket || !shopId) {
      toast.error("Boutique introuvable.");
      return;
    }
    setBusy(true);
    try {
      await createWorkshopPayment(shopId, ticket.id, amount, method, "final");
      const deliveredAt = new Date().toISOString();
      await updateWorkshopTicket(
        ticket.id,
        {
          price_final: entryPaid + amount,
          price_final_paid: true,
          status: "livre",
          delivered_at: deliveredAt,
        },
        activityType,
      );
      const location = await getLocationByTicketId(ticket.id);
      if (location && !(await freeLocation(location.id))) {
        throw new Error("Paiement enregistré, mais le casier n'a pas pu être libéré.");
      }
      await addEvent(ticket.id, "delivered", `Appareil livré. Paiement final : ${formatFcfa(amount)} (${method}).`);
      const [refreshedTicket, refreshedEvents] = await Promise.all([
        getTicketById(ticket.id, activityType),
        getEvents(ticket.id),
      ]);
      if (!refreshedTicket) throw new Error("La fiche livrée est introuvable.");
      setTicket(refreshedTicket);
      setEvents(refreshedEvents);
      setPaymentOpen(false);
      toast.success("Appareil livré au client");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de finaliser la livraison.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p role="alert" className="p-6 text-destructive">{error}</p>;
  if (!ticket) return <p className="p-6 text-muted-foreground">Chargement…</p>;
  const isRepair = activityType !== "consumable";
  const deliveredDate = ticket.delivered_at
    ? new Date(ticket.delivered_at).toLocaleString("fr-FR")
    : new Date().toLocaleString("fr-FR");
  const estimateDetails = [
    duration ? `Durée estimée : ${duration} h` : null,
    `Main d'œuvre : ${formatFcfa(Number(laborCost) || 0)}`,
    `Pièces : ${formatFcfa(Number(partsCost) || 0)}`,
    `Divers : ${formatFcfa(Number(otherCost) || 0)}`,
  ].filter(Boolean).join("\n");

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <PageHero
        title={ticket.device_model ?? "Fiche technique"}
        subtitle="Détails de la fiche et suivi de l'intervention."
        icon={activityType === "phone" ? Smartphone : activityType === "computer" ? Laptop : Package}
        iconColor={activityType === "consumable" ? "green" : "orange"}
        breadcrumb={
          activityType === "consumable"
            ? [
                { label: "Accueil", to: "/dashboard" },
                { label: "Consommables", to: "/consumable/stock" },
                { label: "Produit" },
              ]
            : [
                { label: "Accueil", to: "/dashboard" },
                {
                  label: activityType === "phone" ? "Téléphone" : "Ordinateur",
                  to: `/${activityType}/atelier`,
                },
                { label: "Fiche" },
              ]
        }
      />
      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="font-semibold">{ticket.client_name}</p>
          <p>{ticket.client_whatsapp}</p>
          {technician ? (
            <div className="flex items-center gap-2 pt-1 text-sm">
              {technicianAvatarUrl ? (
                <img src={technicianAvatarUrl} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
                  {(technician.name.trim().slice(0, 1) || "?").toUpperCase()}
                </span>
              )}
              <span><span className="text-muted-foreground">Technicien assigné · </span>{technician.name}</span>
            </div>
          ) : null}
          {ticket.notes ? <p className="whitespace-pre-wrap">{ticket.notes}</p> : null}
          <Badge className={statusStyles[ticket.status]}>{statusLabels[ticket.status]}</Badge>
          {ticket.status !== "livre" ? (
            <Button type="button" variant="outline" onClick={() => openPreview("reception")}>
              Aperçu / Imprimer la réception
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {isRepair && (ticket.status === "en_attente" || ticket.status === "diagnostique") ? (
        <Card>
          <CardHeader><CardTitle>Diagnostic &amp; Devis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              Diagnostic réel
              <Textarea value={diagnostic} onChange={(event) => setDiagnostic(event.target.value)} rows={4} />
            </label>
            <label className="grid max-w-xs gap-2 text-sm font-medium">
              Durée estimée (heures)
              <Input type="number" min="0" step="0.5" value={duration} onChange={(event) => setDuration(event.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">Main d'œuvre (FCFA)<Input type="number" min="0" value={laborCost} onChange={(event) => setLaborCost(event.target.value)} /></label>
              <label className="grid gap-2 text-sm font-medium">Pièces (FCFA)<Input type="number" min="0" value={partsCost} onChange={(event) => setPartsCost(event.target.value)} /></label>
              <label className="grid gap-2 text-sm font-medium">Divers (FCFA)<Input type="number" min="0" value={otherCost} onChange={(event) => setOtherCost(event.target.value)} /></label>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-orange-50 via-white to-green-50 p-4 text-center">
              <p className="text-sm text-slate-600">Total du devis</p>
              <p className="text-3xl font-extrabold text-slate-900">{formatFcfa(estimateTotal)}</p>
            </div>
            <label className="grid max-w-xs gap-2 text-sm font-medium">
              Date estimée de retrait
              <Input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={busy} onClick={() => void validateEstimate()} className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d">
                Valider le devis
              </Button>
              <Button type="button" variant="outline" onClick={() => openPreview("diagnostic")}>
                Aperçu / Imprimer
              </Button>
              <Button type="button" variant="outline" disabled={busy || !ticket.client_whatsapp} onClick={sendEstimateByWhatsapp}>
                Envoyer le devis par WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isRepair &&
      (ticket.status === "en_attente" ||
        ticket.status === "diagnostique" ||
        ticket.status === "en_cours") ? (
        <Card>
          <CardHeader><CardTitle>Réparation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid min-w-[220px] flex-1 gap-2 text-sm font-medium">
                Technicien
                <MemberSelect
                  shopId={shopId}
                  refreshKey={memberRefreshKey}
                  selectedUserId={technician?.user_id ?? ticket.technicien_id ?? undefined}
                  filterRoles={["technicien", "technicien_pc", "manager"]}
                  onSelect={setTechnician}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Ajouter un employé"
                title="Ajouter un employé"
                disabled={!shopId}
                onClick={() => setMemberDialogOpen(true)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Outils utilisés (séparés par des virgules)
              <Input value={tools} onChange={(event) => setTools(event.target.value)} placeholder="Tournevis, ventouse…" />
            </label>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Pièces consommées</p>
              <div>
                <Button type="button" variant="outline" onClick={() => setPartDialogOpen(true)} aria-label="Ajouter une pièce consommée">
                  <Plus className="size-4" />
                  <span className="ml-2">Ajouter une pièce</span>
                </Button>
              </div>
              {pieces.length ? (
                <ul className="space-y-2 text-sm">
                  {pieces.map((part, index) => (
                    <li key={`${part.name}-${index}`} className="flex items-center justify-between rounded-lg border p-2">
                      <span>
                        {part.name} × {part.qty}
                        {part.unit_price !== undefined
                          ? ` · ${formatFcfa(part.unit_price)} / unité`
                          : ""}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Retirer ${part.name}`}
                        onClick={() => setPieces((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Aucune pièce ajoutée.</p>}
            </div>
            {ticket.status !== "en_cours" ? (
              <Button type="button" disabled={busy} onClick={() => void startRepair()} className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d">
                Démarrer la réparation
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void completeRepair()} className="bg-green-600 text-white hover:bg-green-700 shadow-3d">
                Marquer terminé
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {ticket.status === "termine" ? (
        <Card className="bg-card text-card-foreground">
          <CardHeader><CardTitle>Retrait &amp; Encaissement</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-card-foreground">
            <dl className="grid gap-2 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Total dû</dt><dd className="font-bold">{formatFcfa(ticket.price_estimate ?? 0)}</dd></div>
              <div><dt className="text-muted-foreground">Entrée déjà payée</dt><dd className="font-bold">{formatFcfa(entryPaid)}</dd></div>
              <div><dt className="text-muted-foreground">Reste à payer</dt><dd className="font-bold">{formatFcfa(remainingAmount)}</dd></div>
            </dl>
            <Button type="button" disabled={busy} onClick={() => setPaymentOpen(true)} className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d">
              Encaisser le reste
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openPreview("final", "internal")}
            >
              Reçu interne (archive)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openPreview("final", "client")}
            >
              Reçu client
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {ticket.status === "livre" ? (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="font-semibold text-green-800">✅ Appareil livré le {deliveredDate}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => openPreview("final", "internal")}
              >
                Reçu interne (archive)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => openPreview("final", "client")}
              >
                Reçu client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Historique de l'intervention</CardTitle></CardHeader>
        <CardContent><WorkshopTimeline events={events} ticket={ticket} /></CardContent>
      </Card>

      <QuickCreateStaffDialog
        open={memberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        shopId={shopId ?? ""}
        defaultRole="technicien"
        onSuccess={(staff) => {
          setTechnician({
            user_id: staff.user_id ?? staff.id,
            role: staff.role,
            name: staff.full_name ?? "Sans nom",
          });
          setMemberRefreshKey((key) => key + 1);
        }}
      />
      <AddPartDialog
        open={partDialogOpen}
        onOpenChange={setPartDialogOpen}
        onAdd={addConsumedPart}
      />
      <WorkshopPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={remainingAmount}
        title="Encaisser le solde de la réparation"
        onSuccess={(method, amount) => void finishDelivery(method, amount)}
      />
      <Dialog open={previewMode !== null} onOpenChange={(open) => !open && setPreviewMode(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu de la fiche</DialogTitle>
            <DialogDescription>
              {previewMode === "reception"
                ? "Impression du reçu de réception."
                : previewMode === "diagnostic"
                  ? "Impression du diagnostic et du devis."
                  : "Impression du reçu final."}
            </DialogDescription>
          </DialogHeader>
          {previewMode ? (
            <WorkshopTicketPreview
              ticket={ticket}
              mode={previewMode}
              audience={previewAudience}
              onClose={() => setPreviewMode(null)}
              diagnosticDetails={
                previewMode === "diagnostic"
                  ? diagnosticEventDescription || estimateDetails
                  : diagnosticEventDescription
              }
              estimatedPickupDate={pickupDate}
              technicianName={technician?.name}
              finalPaidAmount={ticket.price_final ?? entryPaid + remainingAmount}
              shopName={shop?.name}
              shopAddress={shop?.shop_address ?? shop?.address}
              shopPhone={shop?.shop_phone ?? shop?.phone}
              laborCost={Number(laborCost) || 0}
              partsCost={Number(partsCost) || 0}
              otherCost={Number(otherCost) || 0}
            />
          ) : null}
        </DialogContent>
      </Dialog>
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
            ? [
                { label: "Accueil", to: "/dashboard" },
                { label: "Téléphone" },
                { label: "Carnet d'expérience" },
              ]
            : [
                { label: "Accueil", to: "/dashboard" },
                { label: "Ordinateur" },
                { label: "Carnet d'expérience" },
              ]
        }
      />
      <p className="text-muted-foreground">Module en construction.</p>
    </section>
  );
}
