import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox, PackageCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import type { WorkshopTicket } from "@/types/database";

export function ReceptionDashboard() {
  const { shopId } = useCurrentShop();
  const [toStore, setToStore] = useState<WorkshopTicket[]>([]);
  const [waiting, setWaiting] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setToStore([]);
      setWaiting([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      supabase.from("workshop_tickets").select("*").eq("shop_id", shopId).eq("status", "en_attente_technicien").eq("entry_fee_paid", true),
      supabase.from("workshop_tickets").select("*").eq("shop_id", shopId).eq("status", "en_attente_receptionniste"),
    ]).then(([storageResult, waitingResult]) => {
      setToStore((storageResult.data ?? []) as WorkshopTicket[]);
      setWaiting((waitingResult.data ?? []) as WorkshopTicket[]);
      setLoading(false);
    });
  }, [shopId]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Accueil réception</h1><p className="text-sm text-slate-500">Fiches clients et rangement</p></div>
        <Button asChild><Link to="/reception">Voir la réception complète</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">À ranger</CardTitle><PackageCheck className="size-4 text-orange-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{toStore.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">En attente réception</CardTitle><Inbox className="size-4 text-slate-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{waiting.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Clients suivis</CardTitle><UserRound className="size-4 text-green-800" /></CardHeader><CardContent><div className="text-3xl font-bold">{toStore.length + waiting.length}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Fiches à ranger</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-slate-500">Chargement…</p> : toStore.length === 0 ? <p className="text-sm text-slate-500">Aucune fiche à ranger.</p> : <div className="space-y-2">{toStore.slice(0, 10).map((ticket) => <div key={ticket.id} className="flex justify-between rounded-lg border p-3"><span className="font-medium">{ticket.ticket_number} · {ticket.client_name}</span><span className="text-sm text-slate-500">{ticket.device_brand} {ticket.device_model}</span></div>)}</div>}</CardContent></Card>
    </div>
  );
}
