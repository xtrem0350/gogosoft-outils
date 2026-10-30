import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, PackageCheck, Plus, UserRound, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { QuickCreateClientDialog } from "@/components/QuickCreateClientDialog";
import { DeviceCatalogPicker } from "@/components/DeviceCatalogPicker";
import { StepIndicator } from "@/components/StepIndicator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { ClientRecord } from "@/services/clientService";
import { WorkshopPaymentModal } from "@/components/WorkshopPaymentModal";
import { PlaceTicketModal } from "@/components/caisse/PlaceTicketModal";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { createTicket, type WorkshopTicket } from "@/services/workshopService";
import { assignTicketToLocation, getLocationsByShop } from "@/services/storageService";
import { usePersistedWizardState } from "@/hooks/usePersistedWizardState";

export const Route = createFileRoute("/reception")({ component: ReceptionPage });

function ReceptionPage() {
  const navigate = useNavigate();
  const { shopId } = useCurrentShop();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [ticketsToPlace, setTicketsToPlace] = useState<WorkshopTicket[]>([]);
  const [placeTicket, setPlaceTicket] = useState<{ ticket: WorkshopTicket } | null>(null);
  const [step, setStep, clearStep] = usePersistedWizardState("reception-step", 1);
  const [selectedClient, setSelectedClient, clearSelectedClient] = usePersistedWizardState<ClientRecord | undefined>("reception-selected-client", undefined);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
  const [paymentPaid, setPaymentPaid, clearPaymentPaid] = usePersistedWizardState("reception-payment-paid", false);
  const [paymentMethod, setPaymentMethod, clearPaymentMethod] = usePersistedWizardState("reception-payment-method", "");
  const [locations, setLocations] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientName, setClientName, clearClientName] = usePersistedWizardState("reception-client-name", "");
  const [clientPhone, setClientPhone, clearClientPhone] = usePersistedWizardState("reception-client-phone", "");
  const [deviceBrand, setDeviceBrand, clearDeviceBrand] = usePersistedWizardState("reception-device-brand", "");
  const [deviceModel, setDeviceModel, clearDeviceModel] = usePersistedWizardState("reception-device-model", "");
  const [deviceImei, setDeviceImei, clearDeviceImei] = usePersistedWizardState("reception-device-imei", "");
  const [issue, setIssue, clearIssue] = usePersistedWizardState("reception-issue", "écran cassé");
  const [selectedLocationId, setSelectedLocationId, clearSelectedLocationId] = usePersistedWizardState<string | undefined>("reception-location", undefined);
  const [entryFee, setEntryFee, clearEntryFee] = usePersistedWizardState("reception-entry-fee", 2000);

  useEffect(() => {
    if (!shopId) return;

    void (async () => {
      try {
        const { data } = await import("@/integrations/supabase/client").then(({ supabase }) =>
          supabase.from("workshop_tickets").select("*").eq("shop_id", shopId).eq("status", "en_attente_caissier_entree").order("created_at", { ascending: false }),
        );
        setTickets((data ?? []) as WorkshopTicket[]);
        const nextLocations = await getLocationsByShop(shopId);
        setLocations(nextLocations.map((location) => ({ id: location.id, name: location.name, status: location.status })));
      } catch {
        setTickets([]);
        setLocations([]);
      }
    })();
  }, [shopId]);

  async function loadTicketsToPlace() {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("workshop_tickets")
      .select("*")
      .eq("shop_id", shopId)
      .eq("status", "en_attente_technicien")
      .eq("entry_fee_paid", true)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTicketsToPlace((data ?? []) as WorkshopTicket[]);
  }

  useEffect(() => {
    void loadTicketsToPlace();
  }, [shopId]);

  const waitingCount = tickets.length;
  const occupiedCount = useMemo(
    () => locations.filter((location) => location.status === "occupied").length,
    [locations],
  );

  async function handleCreateTicket() {
    if (!shopId) return;
    const trimmedName = clientName.trim();
    if (!trimmedName) return;

    const ticket = await createTicket({
      shop_id: shopId,
      client_name: trimmedName,
      client_whatsapp: clientPhone.trim() || "",
      device_brand: deviceBrand.trim() || "Autre",
      device_model: deviceModel.trim() || "Modèle inconnu",
      ...(deviceImei.trim() ? { device_imei: deviceImei.trim() } : {}),
      issues: ["ecran_casse"],
      description: `Panne: ${issue}`,
      entry_fee: entryFee,
      entry_fee_paid: true,
      client_id: null,
      activity_type: "phone",
    });

    if (selectedLocationId) {
      await assignTicketToLocation(ticket.id, selectedLocationId);
    }
    toast.success("Fiche envoyée à la caisse pour encaissement des 2 000 F.");
    setOpenCreate(false);
    setStep(1);
    setPaymentPaid(false);
    setPaymentMethod("");
    setSelectedClient(undefined);
    setClientName("");
    setClientPhone("");
    setDeviceBrand("");
    setDeviceModel("");
    setDeviceImei("");
    setIssue("écran cassé");
    setSelectedLocationId(undefined);
    setEntryFee(2000);
    clearStep();
    clearSelectedClient();
    clearClientName();
    clearClientPhone();
    clearDeviceBrand();
    clearDeviceModel();
    clearDeviceImei();
    clearIssue();
    clearSelectedLocationId();
    clearEntryFee();
    clearPaymentPaid();
    clearPaymentMethod();
  }

  function resetWizard() {
    clearStep();
    clearSelectedClient();
    clearClientName();
    clearClientPhone();
    clearDeviceBrand();
    clearDeviceModel();
    clearDeviceImei();
    clearIssue();
    clearSelectedLocationId();
    clearEntryFee();
    clearPaymentPaid();
    clearPaymentMethod();
    setPaymentPaid(false);
    setPaymentMethod("");
    setStep(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Réception"
        subtitle="Suivi des clients en attente et des appareils au casier"
        icon={UserRound}
        iconColor="blue"
        action={<Button className="bg-ivoirien hover:bg-ivoirien-hover" onClick={() => setOpenCreate(true)}><Plus className="mr-2 size-4" /> Nouveau client</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Clients en attente" value={waitingCount} icon={CalendarClock} color="warning" />
        <StatsCard title="Appareils en casier" value={occupiedCount} icon={PackageCheck} color="success" />
        <StatsCard title="Paiement d'entrée" value="2000 FCFA" icon={AlertCircle} color="blue" />
      </div>

      <Card className="card-3d rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PackageCheck className="size-4" /> Fiches à ranger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticketsToPlace.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune fiche à ranger en réception.</p>
          ) : (
            ticketsToPlace.map((ticket) => (
              <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p className="font-medium">{ticket.ticket_number ?? ticket.id} · {ticket.client_name}</p>
                  <p className="text-sm text-muted-foreground">{[ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "Appareil"}</p>
                </div>
                <Button size="sm" onClick={() => setPlaceTicket({ ticket })}>Ranger dans le tiroir</Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="card-3d rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-4" /> Clients en attente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client en attente pour le moment.</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{ticket.client_name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.device_model ?? "Appareil"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">En attente de caisse (entrée 2 000 F)</span>
                    <span className="text-xs uppercase text-amber-700">{ticket.ticket_number}</span>
                    <Button size="sm" variant="outline" onClick={() => void navigate({ to: `/phone/atelier/${ticket.id}` as string })}>Voir</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-3d rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="size-4" /> Appareils en casier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locations.filter((location) => location.status === "occupied").length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appareil en casier.</p>
            ) : (
              locations.filter((location) => location.status === "occupied").map((location) => (
                <div key={location.id} className="flex items-center justify-between rounded-xl border p-3">
                  <span>{location.name}</span>
                  <span className="text-xs uppercase text-emerald-700">Occupé</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3">
            {["Client", "Appareil", "Paiement", "Casier"].map((label, index) => (
              <StepIndicator key={label} number={index + 1} label={label} active={step === index + 1} completed={step > index + 1} />
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label>Client</Label><Button size="sm" variant="outline" onClick={() => setClientDialogOpen(true)}><Plus className="size-4" /> Nouveau</Button></div>
                <ClientSelect shopId={shopId ?? null} value={selectedClient?.id} refreshKey={clientRefreshKey} selectedClient={selectedClient} onSelect={(client) => { setSelectedClient(client); setClientName(client.full_name); setClientPhone(client.whatsapp ?? ""); }} />
                <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nom du client" />
                <Input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="WhatsApp" />
              </div>
              <DialogFooter><Button disabled={!clientName.trim()} onClick={() => setStep(2)}>Suivant</Button></DialogFooter>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <DeviceCatalogPicker shopId={shopId ?? null} category="smartphone" onSelect={(device) => { setDeviceBrand(device.brand); setDeviceModel(device.model); }} onFreeEntry={() => { setDeviceBrand(""); setDeviceModel(""); }} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2"><Label>Marque</Label><Input value={deviceBrand} onChange={(event) => setDeviceBrand(event.target.value)} /></div>
                <div className="space-y-2"><Label>Modèle</Label><Input value={deviceModel} onChange={(event) => setDeviceModel(event.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>IMEI (optionnel)</Label><Input value={deviceImei} onChange={(event) => setDeviceImei(event.target.value)} /></div>
              <div className="space-y-2"><Label>Description de la panne</Label><Textarea value={issue} onChange={(event) => setIssue(event.target.value)} /></div>
              <DialogFooter><Button variant="outline" onClick={() => setStep(1)}>Retour</Button><Button disabled={!deviceModel.trim()} onClick={() => setStep(3)}>Suivant</Button></DialogFooter>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5 text-center">
              <AlertCircle className="mx-auto size-10 text-orange-500" />
              <p className="font-semibold">Frais d&apos;entrée diagnostic : 2 000 FCFA (non remboursable)</p>
              {paymentPaid ? <p className="text-sm font-medium text-green-700">Paiement enregistré · {paymentMethod}</p> : null}
              <DialogFooter><Button variant="outline" onClick={() => setStep(2)}>Retour</Button><Button onClick={() => setStep(4)}>Envoyer à la caisse</Button></DialogFooter>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Casier</Label><StorageLocationSelect shopId={shopId ?? null} value={selectedLocationId} onSelect={(location) => setSelectedLocationId(location.id)} /></div>
              <Card><CardContent className="grid gap-2 p-4 text-sm"><p><b>Client :</b> {clientName}</p><p><b>Appareil :</b> {deviceBrand} {deviceModel}</p><p><b>Montant :</b> 2 000 FCFA</p><p><b>Casier :</b> {locations.find((location) => location.id === selectedLocationId)?.name ?? "Non choisi"}</p></CardContent></Card>
              <DialogFooter><Button variant="outline" onClick={() => setStep(3)}>Retour</Button><Button disabled={!selectedLocationId} onClick={handleCreateTicket}>Créer la fiche</Button></DialogFooter>
            </div>
          ) : null}
          <div className="flex justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={resetWizard}>Réinitialiser</Button>
          </div>
        </DialogContent>
      </Dialog>

      <WorkshopPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={entryFee}
        title="Paiement d'entrée"
        onSuccess={(method, amount) => {
          setPaymentMethod(method);
          setEntryFee(amount);
          setPaymentPaid(true);
          setPaymentOpen(false);
        }}
      />
      <PlaceTicketModal
        open={Boolean(placeTicket)}
        onClose={() => setPlaceTicket(null)}
        ticket={placeTicket?.ticket ?? null}
        onSuccess={() => void loadTicketsToPlace()}
      />
      {shopId ? <QuickCreateClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        shopId={shopId}
        onCreated={(client) => {
          setSelectedClient(client);
          setClientName(client.full_name);
          setClientPhone(client.whatsapp ?? "");
          setClientRefreshKey((key) => key + 1);
          setClientDialogOpen(false);
        }}
      /> : null}
    </div>
  );
}
