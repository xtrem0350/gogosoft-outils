import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox, Laptop, Package, PackageCheck, Plus, UserRound } from "lucide-react";

import { StorageLocationsPage } from "@/components/StorageLocationPages";
import { StorageLocationDialog } from "@/components/StorageLocationDialog";
import { ReadOnlyGuard } from "@/components/SubscriptionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClientsByShop, type ClientRecord } from "@/services/clientService";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import type { WorkshopTicket } from "@/types/database";

export function ReceptionDashboard() {
  const { shopId } = useCurrentShop();
  const [toStore, setToStore] = useState<WorkshopTicket[]>([]);
  const [waiting, setWaiting] = useState<WorkshopTicket[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isLocationsListOpen, setIsLocationsListOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setToStore([]);
      setWaiting([]);
      setClients([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(null);
    void Promise.all([
      supabase.from("workshop_tickets").select("*").eq("shop_id", shopId).eq("status", "en_attente_technicien").eq("entry_fee_paid", true).is("storage_location_id", null),
      supabase.from("workshop_tickets").select("*").eq("shop_id", shopId).eq("status", "en_attente_receptionniste"),
      getClientsByShop(shopId),
    ]).then(([storageResult, waitingResult, clientList]) => {
      if (storageResult.error) throw storageResult.error;
      if (waitingResult.error) throw waitingResult.error;
      if (!active) return;
      setToStore((storageResult.data ?? []) as WorkshopTicket[]);
      setWaiting((waitingResult.data ?? []) as WorkshopTicket[]);
      setClients(clientList);
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Impossible de charger l'accueil réception.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [shopId]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Accueil réception</h1><p className="text-sm text-slate-500">Fiches clients et rangement</p></div>
        <div className="flex flex-wrap gap-2">
          <ReadOnlyGuard><Button variant="outline" asChild><Link to="/clients/nouveau"><Plus className="mr-2 size-4" />Nouveau client</Link></Button></ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button
              type="button"
              variant="outline"
              disabled={!shopId}
              onClick={() => setIsLocationDialogOpen(true)}
            >
              <Package className="mr-2 size-4" />Nouveau Rangement
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard><Button asChild><Link to="/reception">Nouvelle réception / Wizard</Link></Button></ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button variant="outline" asChild>
              <Link to="/computer/atelier/nouveau">
                <Laptop className="mr-2 size-4" />
                Nouvelle réception ordinateur
              </Link>
            </Button>
          </ReadOnlyGuard>
        </div>
      </div>
      {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">À ranger</CardTitle><PackageCheck className="size-4 text-orange-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{toStore.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">En attente réception</CardTitle><Inbox className="size-4 text-slate-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{waiting.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Clients enregistrés</CardTitle><UserRound className="size-4 text-green-800" /></CardHeader><CardContent><div className="text-3xl font-bold">{clients.length}</div><Button variant="link" className="px-0" asChild><Link to="/clients">Voir les clients</Link></Button></CardContent></Card>
      </div>
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fiches à ranger</CardTitle><Button type="button" variant="outline" onClick={() => setIsLocationsListOpen(true)}>Traiter les rangements</Button></CardHeader><CardContent>{loading ? <p className="text-sm text-slate-500">Chargement…</p> : toStore.length === 0 ? <p className="text-sm text-slate-500">Aucune fiche à ranger.</p> : <div className="space-y-2">{toStore.slice(0, 10).map((ticket) => <div key={ticket.id} className="flex justify-between rounded-lg border p-3"><span className="font-medium">{ticket.ticket_number} · {ticket.client_name}</span><span className="text-sm text-slate-500">{ticket.device_brand} {ticket.device_model}</span></div>)}</div>}</CardContent></Card>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/catalogue">Ouvrir le catalogue</Link>
        </Button>
      </div>
      <StorageLocationDialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        shopId={shopId ?? ""}
        onSaved={() => setIsLocationDialogOpen(false)}
      />
      <Dialog open={isLocationsListOpen} onOpenChange={setIsLocationsListOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto">
          <DialogTitle className="text-xl font-semibold">Rangements</DialogTitle>
          <DialogDescription className="sr-only">
            Liste et gestion des emplacements de rangement.
          </DialogDescription>
          <StorageLocationsPage plan={false} embedded />
        </DialogContent>
      </Dialog>
    </div>
  );
}
