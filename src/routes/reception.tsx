import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, PackageCheck, Plus, UserRound, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { WorkshopPaymentModal } from "@/components/WorkshopPaymentModal";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { createTicket, type WorkshopTicket } from "@/services/workshopService";
import { assignTicketToLocation, getLocationsByShop } from "@/services/storageService";

export const Route = createFileRoute("/reception")({ component: ReceptionPage });

function ReceptionPage() {
  const { shopId } = useCurrentShop();
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [issue, setIssue] = useState("écran cassé");
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [entryFee, setEntryFee] = useState(2000);

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

    setOpenCreate(false);
    setClientName("");
    setClientPhone("");
    setDeviceBrand("");
    setDeviceModel("");
    setDeviceImei("");
    setIssue("écran cassé");
    setSelectedLocationId(undefined);
    setEntryFee(2000);
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
                  <span className="text-xs uppercase text-amber-700">{ticket.status}</span>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nom du client" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="+225 ..." />
            </div>
            <div className="space-y-2">
              <Label>Marque</Label>
              <Input value={deviceBrand} onChange={(event) => setDeviceBrand(event.target.value)} placeholder="Samsung, iPhone..." />
            </div>
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Input value={deviceModel} onChange={(event) => setDeviceModel(event.target.value)} placeholder="A54, 13 Pro..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Panne</Label>
              <Input value={issue} onChange={(event) => setIssue(event.target.value)} placeholder="Description de la panne" />
            </div>
            <div className="space-y-2">
              <Label>IMEI</Label>
              <Input value={deviceImei} onChange={(event) => setDeviceImei(event.target.value)} placeholder="IMEI" />
            </div>
            <div className="space-y-2">
              <Label>Entrée</Label>
              <Input type="number" value={entryFee} onChange={(event) => setEntryFee(Number(event.target.value || 0))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Choix casier</Label>
              <StorageLocationSelect shopId={shopId ?? null} value={selectedLocationId} onSelect={(location) => setSelectedLocationId(location.id)} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Annuler</Button>
            <Button className="bg-ivoirien hover:bg-ivoirien-hover" onClick={handleCreateTicket}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WorkshopPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={entryFee}
        title="Paiement d'entrée"
        onSuccess={() => {
          setPaymentOpen(false);
        }}
      />
    </div>
  );
}
