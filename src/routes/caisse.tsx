import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { CashClosureModal } from "@/components/CashClosureModal";
import { CashReceiptModal, type CashReceipt } from "@/components/CashReceiptModal";
import { WorkshopPaymentModal } from "@/components/WorkshopPaymentModal";
import { TicketDetailModal } from "@/components/caisse/TicketDetailModal";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaisseClosureTab } from "@/components/caisse/CaisseClosureTab";
import { CaisseEntriesTab } from "@/components/caisse/CaisseEntriesTab";
import { CaisseExitsTab } from "@/components/caisse/CaisseExitsTab";
import { CaissePeriodSelector, type PeriodPreset } from "@/components/caisse/CaissePeriodSelector";
import { CaisseRecapTab } from "@/components/caisse/CaisseRecapTab";
import { CaisseSessionHeader } from "@/components/caisse/CaisseSessionHeader";
import { CaisseStatsCards } from "@/components/caisse/CaisseStatsCards";
import { CashEntryModal } from "@/components/caisse/CashEntryModal";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  closeWorkshopTicketPayment,
  closeCashSession,
  createCashExit,
  getOpenCashSession,
  getCashClosures,
  getCashExits,
  getCashSummary,
  type CashClosure,
  type CashExit,
  type CashPeriod,
  type CashSummary,
  type CashSession,
  openCashSession,
} from "@/services/cashService";
import { isDemoMode } from "@/services/demoService";
import { listSales, markAsPaid, type SalePaymentMethod } from "@/services/salesService";
import { getTeamMembers } from "@/services/teamService";

export const Route = createFileRoute("/caisse")({
  validateSearch: (search: Record<string, unknown>) => ({
    action: typeof Reflect.get(search, "action") === "string" ? Reflect.get(search, "action") : undefined,
    ticket: typeof Reflect.get(search, "ticket") === "string" ? Reflect.get(search, "ticket") : undefined,
  }),
  component: CashPage,
});

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN Money",
  moov: "Moov Money",
};
const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

function localDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildPeriod(preset: PeriodPreset, customStart: string, customEnd: string): CashPeriod {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  const start = new Date(`${customStart}T00:00:00`);
  const end = new Date(`${customEnd}T23:59:59.999`);
  return { start: Number.isNaN(start.getTime()) ? now : start, end: Number.isNaN(end.getTime()) ? now : end };
}

interface WorkshopTicket {
  id: string;
  ticket_number: string;
  client_name: string;
  client_whatsapp?: string;
  device_brand?: string;
  device_model?: string;
  device_imei?: string;
  description?: string;
  technicien_id?: string;
  technicien_name?: string;
  quote_amount?: number;
  entry_fee?: number;
  status?: string;
}

function CashPage() {
  const { action, ticket: requestedTicketId } = Route.useSearch();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { isOwner, isCaissier } = useUserRole();
  const demo = isDemoMode();
  const [preset, setPreset] = useState<PeriodPreset>("today");
  const [customStart, setCustomStart] = useState(() => localDateValue(new Date()));
  const [customEnd, setCustomEnd] = useState(() => localDateValue(new Date()));
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [exits, setExits] = useState<CashExit[]>([]);
  const [entryTickets, setEntryTickets] = useState<WorkshopTicket[]>([]);
  const [finalTickets, setFinalTickets] = useState<WorkshopTicket[]>([]);
  const [ticketPayment, setTicketPayment] = useState<{ ticket: WorkshopTicket; type: "entry" | "final" } | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{ ticket: WorkshopTicket; type: "entry" | "final" } | null>(null);
  const [pendingSales, setPendingSales] = useState<Array<{ id: string; product_name: string; client_name: string | null; total_price: number; created_at: string }>>([]);
  const [paymentMethodsBySale, setPaymentMethodsBySale] = useState<Record<string, SalePaymentMethod>>({});
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({});
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [closureOpen, setClosureOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitType, setExitType] = useState<"parts" | "expense">("expense");
  const [exitAmount, setExitAmount] = useState("");
  const [exitDescription, setExitDescription] = useState("");
  const [savingExit, setSavingExit] = useState(false);
  const [receipt, setReceipt] = useState<CashReceipt | null>(null);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const period = useMemo(() => buildPeriod(preset, customStart, customEnd), [preset, customEnd, customStart]);

  const load = useCallback(async () => {
    if (!shopId) {
      setSummary(null);
      setClosures([]);
      setCashSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextSummary, nextClosures, members, nextExits, sales, workshopRows, openSession] = await Promise.all([
        getCashSummary(shopId, period),
        getCashClosures(shopId),
        getTeamMembers(shopId),
        getCashExits(shopId, period),
        listSales(shopId),
        supabase.from("workshop_tickets" as never).select("id,ticket_number,client_name,client_whatsapp,device_brand,device_model,device_imei,description,technicien_id,status,quote_amount,entry_fee").eq("shop_id", shopId).in("status", ["en_attente_caissier_entree", "en_attente_caissier_solde"]),
        getOpenCashSession(shopId),
      ]);
      setSummary(nextSummary);
      setClosures(nextClosures);
      setExits(nextExits);
      const workshopTickets = (workshopRows.data ?? []) as WorkshopTicket[];
      workshopTickets.forEach((ticket) => {
        ticket.technicien_name = ticket.technicien_id
          ? Object.fromEntries(members.map((member) => [member.user_id, member.full_name ?? member.email ?? member.user_id]))[ticket.technicien_id] ?? ""
          : "";
      });
      setEntryTickets(workshopTickets.filter((ticket) => ticket.status === "en_attente_caissier_entree"));
      setFinalTickets(workshopTickets.filter((ticket) => ticket.status === "en_attente_caissier_solde"));
      setPendingSales(demo ? [] : sales.filter((sale) => sale.payment_status === "pending" || sale.payment_status === "awaiting_payment"));
      setMemberAvatars(Object.fromEntries(members.filter((member) => member.avatar_url).map((member) => [member.user_id, member.avatar_url as string])));
      setMemberNames(Object.fromEntries(members.map((member) => [member.user_id, member.full_name ?? member.email ?? member.user_id])));
      setCashSession(openSession);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger la caisse.");
    } finally {
      setLoading(false);
    }
  }, [demo, period, shopId]);

  useEffect(() => {
    if (!shopLoading) void load();
  }, [load, shopLoading]);

  useEffect(() => {
    if (action !== "validate" || loading) return;
    const pendingTickets = [...entryTickets, ...finalTickets];
    if (pendingTickets.length === 0) {
      toast.info("Aucun paiement en attente.");
      return;
    }
    const targetTicket = requestedTicketId
      ? pendingTickets.find((ticket) => ticket.id === requestedTicketId)
      : pendingTickets[0];
    if (!targetTicket) {
      toast.info("Aucun paiement en attente.");
      return;
    }
    setTicketPayment({
      ticket: targetTicket,
      type: entryTickets.some((ticket) => ticket.id === targetTicket.id) ? "entry" : "final",
    });
  }, [action, entryTickets, finalTickets, loading, requestedTicketId]);

  const totalExits = exits.reduce((total, exit) => total + exit.amount, 0);
  const canManageCash = isOwner || isCaissier;

  async function saveExit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!shopId) {
      toast.error("Aucun atelier actif.");
      return;
    }
    const amount = Number(exitAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Saisissez un montant supérieur à zéro.");
      return;
    }
    setSavingExit(true);
    try {
      await createCashExit(shopId, { type: exitType, amount, description: exitDescription });
      setExitAmount("");
      setExitDescription("");
      setExitOpen(false);
      toast.success("Sortie de caisse enregistrée.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la sortie.");
    } finally {
      setSavingExit(false);
    }
  }

  async function collectTicketPayment(method: string, amount: number): Promise<void> {
    if (!cashSession) {
      toast.error("Ouvrez la caisse avant d'encaisser.");
      return;
    }
    if (!ticketPayment || !shopId) return;
    const paymentMethodMap: Record<string, "cash" | "wave" | "orange_money" | "mtn" | "moov"> = {
      Espèces: "cash", Wave: "wave", "Orange Money": "orange_money", MTN: "mtn", Moov: "moov",
    };
    const paymentMethod = paymentMethodMap[method];
    if (!paymentMethod) {
      toast.error("Mode de paiement invalide.");
      return;
    }
    try {
      await closeWorkshopTicketPayment({ ticketId: ticketPayment.ticket.id, amount, paymentType: ticketPayment.type === "entry" ? "entry" : "balance", paymentMethod });
      toast.success(ticketPayment.type === "entry" ? "Entrée encaissée. Réceptionniste notifié pour le rangement." : "Solde encaissé. Réceptionniste notifié pour le rangement.");
      setTicketPayment(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'encaisser le ticket.");
    }
  }

  async function collectSale(saleId: string) {
    if (!cashSession) {
      toast.error("Ouvrez la caisse avant d'encaisser.");
      return;
    }
    try {
      await markAsPaid(saleId, paymentMethodsBySale[saleId] ?? "cash");
      toast.success("Paiement de la vente encaissé.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'encaisser cette vente.");
    }
  }

  async function handleOpenSession(openingAmount: number): Promise<void> {
    if (!shopId) return;
    try {
      await openCashSession(shopId, openingAmount);
      toast.success("Caisse ouverte.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ouvrir la caisse.");
    }
  }

  async function handleCloseSession(closingAmount: number, notes?: string): Promise<void> {
    if (!cashSession) return;
    try {
      await closeCashSession(cashSession.id, closingAmount, notes);
      toast.success("Caisse fermée.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de fermer la caisse.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title="Caisse" subtitle="Suivi des encaissements" icon={Wallet} iconColor="green" />
      <CaisseSessionHeader shopId={shopId} session={cashSession} openedByName={cashSession ? memberNames[cashSession.opened_by] : undefined} onOpen={(openingAmount) => handleOpenSession(openingAmount)} onClose={(closingAmount, notes) => handleCloseSession(closingAmount, notes)} />
      <CaissePeriodSelector preset={preset} onPresetChange={setPreset} customStart={customStart} customEnd={customEnd} onCustomChange={(start, end) => { setCustomStart(start); setCustomEnd(end); }} period={period} />
      <CaisseStatsCards summary={summary} totalExits={totalExits} loading={loading} />
      {!demo ? (
        <Card className="card-3d rounded-xl">
          <CardHeader><CardTitle>Détail par mode de paiement</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.keys(METHOD_LABELS).map((method) => (
              <div key={method} className="flex justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{METHOD_LABELS[method]}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatMoney(summary?.breakdown[method] ?? 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Tabs defaultValue="encaissements" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="encaissements">Encaissements</TabsTrigger>
          <TabsTrigger value="decaissements">Décaissements</TabsTrigger>
          <TabsTrigger value="recap">Récap</TabsTrigger>
          <TabsTrigger value="cloture">Clôture</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="encaissements">
          {!demo ? <CaisseEntriesTab summary={summary} pendingSales={pendingSales} paymentMethodsBySale={paymentMethodsBySale} onPaymentMethodChange={(saleId, method) => setPaymentMethodsBySale((current) => ({ ...current, [saleId]: method }))} onCollectSale={(saleId) => void collectSale(saleId)} onReceipt={setReceipt} entryTickets={entryTickets} finalTickets={finalTickets} onCollectTicket={(ticket, type) => { if (!cashSession) { toast.error("Ouvrez la caisse avant d'encaisser."); return; } setTicketPayment({ ticket, type }); }} onTicketDetail={(ticket, type) => setTicketDetail({ ticket, type })} sessionOpen={Boolean(cashSession)} onAddEntry={() => setEntryModalOpen(true)} /> : null}
        </TabsContent>
        <TabsContent value="decaissements">
          {!demo && canManageCash ? <CaisseExitsTab exits={exits} onAdd={() => setExitOpen(true)} onReceipt={() => undefined} /> : null}
        </TabsContent>
        <TabsContent value="recap"><CaisseRecapTab summary={summary} memberAvatars={memberAvatars} /></TabsContent>
        <TabsContent value="cloture"><CaisseClosureTab summary={summary} exits={exits} closures={closures} onClosure={() => setClosureOpen(true)} loading={loading} shopId={shopId} showHistory={false} /></TabsContent>
        <TabsContent value="historique"><CaisseClosureTab summary={summary} exits={exits} closures={closures} onClosure={() => setClosureOpen(true)} loading={loading} shopId={shopId} showHistory /></TabsContent>
      </Tabs>

      {summary ? <CashClosureModal open={closureOpen} onClose={() => setClosureOpen(false)} summary={summary} period={period} exitsTotal={totalExits} onSuccess={() => void load()} /> : null}
      <CashReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <CashEntryModal open={entryModalOpen} onClose={() => setEntryModalOpen(false)} onSuccess={() => void load()} shopId={shopId} />
      <TicketDetailModal
        open={Boolean(ticketDetail)}
        onClose={() => setTicketDetail(null)}
        ticket={ticketDetail?.ticket ?? null}
        ticketType={ticketDetail?.type ?? "entry"}
        onValidate={() => {
          if (!ticketDetail) return;
          if (!cashSession) {
            toast.error("Ouvrez la caisse avant d'encaisser.");
            return;
          }
          setTicketPayment({ ticket: ticketDetail.ticket, type: ticketDetail.type });
          setTicketDetail(null);
        }}
      />
      {ticketPayment ? <WorkshopPaymentModal open={Boolean(ticketPayment)} onClose={() => setTicketPayment(null)} amount={ticketPayment.type === "entry" ? 2000 : Math.max(0, Number(ticketPayment.ticket.quote_amount ?? 0) - 2000)} title={ticketPayment.type === "entry" ? "Encaisser l'entrée" : "Encaisser le solde"} onSuccess={(method, amount) => void collectTicketPayment(method, amount)} /> : null}
      <Dialog open={exitOpen} onOpenChange={(open) => !savingExit && setExitOpen(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une sortie de caisse</DialogTitle></DialogHeader>
          <form onSubmit={(event) => void saveExit(event)} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">Type
              <select value={exitType} onChange={(event) => setExitType(event.target.value as "parts" | "expense")} className="h-10 rounded-md border border-input bg-background px-3">
                <option value="parts">Pièces</option><option value="expense">Dépense diverse</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">Montant<Input type="number" min="1" step="1" value={exitAmount} onChange={(event) => setExitAmount(event.target.value)} required /></label>
            <label className="grid gap-2 text-sm font-medium">Description<Input value={exitDescription} onChange={(event) => setExitDescription(event.target.value)} maxLength={240} placeholder="Commande fournisseur, électricité, internet…" /></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setExitOpen(false)} disabled={savingExit}>Annuler</Button><Button type="submit" disabled={savingExit}>{savingExit ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
