import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarDays, Plus, Printer, Wallet } from "lucide-react";
import { toast } from "sonner";

import { CashClosureModal } from "@/components/CashClosureModal";
import { WorkshopPaymentModal } from "@/components/WorkshopPaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { CashReceiptModal, type CashReceipt } from "@/components/CashReceiptModal";
import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useUserRole } from "@/hooks/useUserRole";
import { isDemoMode } from "@/services/demoService";
import { listSales, markAsPaid, type SalePaymentMethod } from "@/services/salesService";
import { getTeamMembers } from "@/services/teamService";
import {
  closeWorkshopTicketPayment,
  createCashExit,
  getCashExits,
  getCashClosures,
  getCashSummary,
  type CashClosure,
  type CashExit,
  type CashPeriod,
  type CashSummary,
} from "@/services/cashService";

export const Route = createFileRoute("/caisse")({ component: CashPage });

type PeriodPreset = "today" | "week" | "month" | "custom";

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN Money",
  moov: "Moov Money",
};
const CASHIER_METHODS: Array<{ value: SalePaymentMethod; label: string }> = [
  { value: "cash", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn", label: "MTN" },
  { value: "moov", label: "Moov" },
];

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
  return {
    start: Number.isNaN(start.getTime()) ? now : start,
    end: Number.isNaN(end.getTime()) ? now : end,
  };
}

function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR");
}

function periodLabel(period: CashPeriod): string {
  return `${period.start.toLocaleDateString("fr-FR")} – ${period.end.toLocaleDateString("fr-FR")}`;
}

function CashPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const { isOwner, isCaissier } = useUserRole();
  const demo = isDemoMode();
  const [preset, setPreset] = useState<PeriodPreset>("today");
  const [customStart, setCustomStart] = useState(() => localDateValue(new Date()));
  const [customEnd, setCustomEnd] = useState(() => localDateValue(new Date()));
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [exits, setExits] = useState<CashExit[]>([]);
  const [entryTickets, setEntryTickets] = useState<Array<{ id: string; ticket_number: string; client_name: string }>>([]);
  const [finalTickets, setFinalTickets] = useState<Array<{ id: string; ticket_number: string; client_name: string; quote_amount?: number }>>([]);
  const [ticketPayment, setTicketPayment] = useState<{ ticket: { id: string; ticket_number: string; client_name: string; quote_amount?: number }; type: "entry" | "final" } | null>(null);
  const [pendingSales, setPendingSales] = useState<
    Array<{ id: string; product_name: string; client_name: string | null; total_price: number; created_at: string }>
  >([]);
  const [paymentMethodsBySale, setPaymentMethodsBySale] = useState<Record<string, SalePaymentMethod>>({});
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [closureOpen, setClosureOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitType, setExitType] = useState<"parts" | "expense">("expense");
  const [exitAmount, setExitAmount] = useState("");
  const [exitDescription, setExitDescription] = useState("");
  const [savingExit, setSavingExit] = useState(false);
  const [receipt, setReceipt] = useState<CashReceipt | null>(null);
  const [expandedClosureId, setExpandedClosureId] = useState<string | null>(null);
  const period = useMemo(
    () => buildPeriod(preset, customStart, customEnd),
    [preset, customEnd, customStart],
  );

  const load = useCallback(async () => {
    if (!shopId) {
      setSummary(null);
      setClosures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextSummary, nextClosures, members, nextExits, sales, workshopRows] = await Promise.all([
        getCashSummary(shopId, period),
        getCashClosures(shopId),
        getTeamMembers(shopId),
        getCashExits(shopId, period),
        listSales(shopId),
        supabase.from("workshop_tickets" as never).select("id,ticket_number,client_name,status,quote_amount").eq("shop_id", shopId).in("status", ["en_attente_caissier_entree", "en_attente_caissier_solde"]),
      ]);
      setSummary(nextSummary);
      setClosures(nextClosures);
      setExits(nextExits);
      const workshopTickets = (workshopRows.data ?? []) as Array<{ id: string; ticket_number: string; client_name: string; status: string; quote_amount?: number }>;
      setEntryTickets(workshopTickets.filter((ticket) => ticket.status === "en_attente_caissier_entree"));
      setFinalTickets(workshopTickets.filter((ticket) => ticket.status === "en_attente_caissier_solde"));
      setPendingSales(
        demo
          ? []
          : sales.filter((sale) => sale.payment_status === "pending" || sale.payment_status === "awaiting_payment"),
      );
      setMemberAvatars(Object.fromEntries(
        members.filter((member) => member.avatar_url).map((member) => [member.user_id, member.avatar_url as string]),
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger la caisse.");
    } finally {
      setLoading(false);
    }
  }, [demo, period, shopId]);

  useEffect(() => {
    if (!shopLoading) void load();
  }, [load, shopLoading]);

  const paymentMethods = Object.keys(METHOD_LABELS);
  const totalExits = exits.reduce((total, exit) => total + exit.amount, 0);
  const balance = (summary?.totalGeneral ?? 0) - totalExits;
  const canManageCash = isOwner || isCaissier;

  async function saveExit(event: React.FormEvent<HTMLFormElement>) {
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
      await createCashExit(shopId, {
        type: exitType,
        amount,
        description: exitDescription,
      });
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

  async function collectTicketPayment(method: string, amount: number) {
    if (!ticketPayment || !shopId) return;
    const paymentMethodMap: Record<string, "cash" | "wave" | "orange_money" | "mtn" | "moov"> = {
      Espèces: "cash",
      Wave: "wave",
      "Orange Money": "orange_money",
      MTN: "mtn",
      Moov: "moov",
    };
    const paymentMethod = paymentMethodMap[method];
    if (!paymentMethod) {
      toast.error("Mode de paiement invalide.");
      return;
    }

    try {
      await closeWorkshopTicketPayment({
        ticketId: ticketPayment.ticket.id,
        amount,
        paymentType: ticketPayment.type === "entry" ? "entry" : "balance",
        paymentMethod,
      });
      toast.success(ticketPayment.type === "entry"
        ? "Entrée encaissée. Le technicien a été notifié."
        : "Solde encaissé. Le réceptionniste a été notifié.");
      setTicketPayment(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'encaisser le ticket.");
    }
  }

  async function collectSale(saleId: string) {
    const method = paymentMethodsBySale[saleId] ?? "cash";
    try {
      await markAsPaid(saleId, method);
      toast.success("Paiement de la vente encaissé.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'encaisser cette vente.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Caisse"
        subtitle="Suivi des encaissements"
        icon={Wallet}
        iconColor="green"
      />

      <Card className="card-3d rounded-xl">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Période caisse">
            {([
              ["today", "Aujourd'hui"],
              ["week", "Cette semaine"],
              ["month", "Ce mois"],
              ["custom", "Personnalisé"],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={preset === value ? "default" : "outline"}
                aria-pressed={preset === value}
                onClick={() => setPreset(value)}
                className={preset === value ? "bg-ivoirien text-white shadow-3d" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
          {preset === "custom" ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Du
                <Input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="h-10 w-40"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Au
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="h-10 w-40"
                />
              </label>
            </div>
          ) : null}
          <p className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" /> {periodLabel(period)}
          </p>
        </CardContent>
      </Card>

      {demo ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total atelier"
            value={loading ? "…" : formatMoney(summary?.totalWorkshop ?? 0)}
            icon={Banknote}
            color="warning"
          />
          <StatsCard
            title="Total ventes"
            value={loading ? "…" : formatMoney(summary?.totalSales ?? 0)}
            icon={Wallet}
            color="success"
          />
          <Card className="card-3d rounded-2xl border-0 bg-ivoirien text-white shadow-3d">
            <CardContent className="flex min-h-[104px] items-center gap-4 p-6">
              <Wallet className="size-8 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase">Total général</p>
                <p className="mt-2 truncate text-3xl font-extrabold">
                  {loading ? "…" : formatMoney(summary?.totalGeneral ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total entrées"
            value={loading ? "…" : formatMoney(summary?.totalGeneral ?? 0)}
            icon={Banknote}
            color="success"
          />
          <StatsCard
            title="Total sorties"
            value={loading ? "…" : formatMoney(totalExits)}
            icon={Wallet}
            color="warning"
          />
          <Card className="card-3d rounded-2xl border-0 bg-ivoirien text-white shadow-3d">
            <CardContent className="flex min-h-[104px] items-center gap-4 p-6">
              <Wallet className="size-8 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase">Solde de la période</p>
                <p className="mt-2 truncate text-3xl font-extrabold">
                  {loading ? "…" : formatMoney(balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="card-3d rounded-xl">
        <CardHeader><CardTitle>Détail par mode de paiement</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {paymentMethods.map((method) => (
            <div
              key={method}
              className="flex justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{METHOD_LABELS[method]}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatMoney(summary?.breakdown[method] ?? 0)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {!demo ? <Card className="card-3d rounded-xl">
        <CardHeader>
          <CardTitle>Entrées en caisse</CardTitle>
          <p className="text-sm text-muted-foreground">Paiements de réparation et ventes encaissées.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <h3 className="font-semibold">Paiements réparation</h3>
            {summary?.workshopPayments.length ? summary.workshopPayments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">
                    {payment.payment_type === "final" ? "Solde réparation" : "Acompte réparation"} · {payment.ticket_number ?? "Ticket"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.client_name ?? "Client —"} · {payment.device_model ?? "Appareil —"} · {METHOD_LABELS[payment.method] ?? payment.method}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(payment.amount)}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setReceipt({
                      reference: payment.ticket_number ?? payment.id,
                      clientName: payment.client_name ?? "",
                      device: payment.device_model ?? "",
                      amount: payment.amount,
                      date: payment.created_at,
                    })}
                  >
                    <Printer className="size-4" /> Émettre reçu
                  </Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aucun paiement réparation sur cette période.</p>}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Paiements vente</h3>
            {summary?.sales.length ? summary.sales.map((sale) => (
              <div key={sale.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{sale.product_name}</p>
                  <p className="text-sm text-muted-foreground">{sale.client_name ?? "Client —"} · Vente encaissée</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(sale.total_price)}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setReceipt({
                      reference: sale.id,
                      clientName: sale.client_name ?? "",
                      device: sale.product_name,
                      amount: sale.total_price,
                      date: sale.created_at,
                    })}
                  >
                    <Printer className="size-4" /> Émettre reçu
                  </Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aucune vente encaissée sur cette période.</p>}
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold">Paiements vente en attente</h3>
            {pendingSales.length ? pendingSales.map((sale) => (
              <div key={sale.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-900 dark:bg-orange-950/20">
                <div>
                  <p className="font-medium">{sale.product_name}</p>
                  <p className="text-sm text-muted-foreground">{sale.client_name ?? "Client —"} · {formatDate(sale.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{formatMoney(sale.total_price)}</span>
                  <select
                    aria-label={`Mode de paiement pour ${sale.product_name}`}
                    value={paymentMethodsBySale[sale.id] ?? "cash"}
                    onChange={(event) => setPaymentMethodsBySale((current) => ({
                      ...current,
                      [sale.id]: event.target.value as SalePaymentMethod,
                    }))}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {CASHIER_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                  </select>
                  <Button type="button" size="sm" onClick={() => void collectSale(sale.id)}>Encaisser</Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aucun paiement vente en attente.</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Les devis validés ne sont pas enregistrés comme des encaissements distincts ; ils apparaissent ici dès qu&apos;un paiement est saisi.
          </p>
        </CardContent>
      </Card> : null}

      {!demo ? <Card className="card-3d rounded-xl">
        <CardHeader><CardTitle>Fiches atelier à encaisser</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[...entryTickets.map((ticket) => ({ ticket, type: "entry" as const, amount: 2000 })), ...finalTickets.map((ticket) => ({ ticket, type: "final" as const, amount: Math.max(0, Number(ticket.quote_amount ?? 0) - 2000) }))].map(({ ticket, type, amount }) => (
            <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div><p className="font-medium">{ticket.ticket_number} · {ticket.client_name}</p><p className="text-xs text-muted-foreground">{type === "entry" ? "Entrée" : "Solde"} · {formatMoney(amount)}</p></div>
              <Button size="sm" onClick={() => setTicketPayment({ ticket, type })}>{type === "entry" ? "Encaisser l'entrée" : "Encaisser le solde"}</Button>
            </div>
          ))}
          {entryTickets.length === 0 && finalTickets.length === 0 ? <p className="text-sm text-muted-foreground">Aucune fiche atelier en attente.</p> : null}
        </CardContent>
      </Card> : null}

      {!demo ? <Card className="card-3d rounded-xl">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Sorties de caisse</CardTitle>
            <p className="text-sm text-muted-foreground">Pièces et dépenses diverses de la période.</p>
          </div>
          {canManageCash && !demo ? (
            <Button type="button" onClick={() => setExitOpen(true)}>
              <Plus className="size-4" /> Ajouter une sortie
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {exits.length ? exits.map((exit) => (
            <div key={exit.id} className="flex flex-wrap justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{exit.type === "parts" ? "Paiement pièces" : "Dépense diverse"}</p>
                <p className="text-sm text-muted-foreground">{exit.description || "Sans description"} · {formatDate(exit.created_at)}</p>
              </div>
              <span className="font-bold text-destructive">− {formatMoney(exit.amount)}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">
              {demo ? "Les sorties de caisse ne sont pas gérées dans le mode démo." : "Aucune sortie de caisse sur cette période."}
            </p>
          )}
        </CardContent>
      </Card> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="card-3d min-w-0 rounded-xl">
          <CardHeader><CardTitle>Paiements atelier</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-sm">
              <thead><tr className="border-b text-muted-foreground"><th className="p-2">Ticket</th><th className="p-2">Mode</th><th className="p-2">Montant</th><th className="p-2">Date</th></tr></thead>
              <tbody>
                {(summary?.workshopPayments ?? []).map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        {payment.received_by && memberAvatars[payment.received_by] ? (
                          <img src={memberAvatars[payment.received_by]} alt="" className="size-8 rounded-full object-cover" />
                        ) : null}
                        {payment.ticket_number ?? "—"}
                      </span>
                    </td>
                    <td className="p-2">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                    <td className="p-2 font-semibold">{formatMoney(payment.amount)}</td>
                    <td className="p-2 text-muted-foreground">{formatDate(payment.created_at)}</td>
                  </tr>
                ))}
                {!loading && !summary?.workshopPayments.length ? <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Aucun paiement atelier sur cette période.</td></tr> : null}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="card-3d min-w-0 rounded-xl">
          <CardHeader><CardTitle>Ventes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-sm">
              <thead><tr className="border-b text-muted-foreground"><th className="p-2">Produit</th><th className="p-2">Mode</th><th className="p-2">Total</th><th className="p-2">Date</th></tr></thead>
              <tbody>
                {(summary?.sales ?? []).map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{sale.product_name}</td>
                    <td className="p-2">{sale.payment_method ? METHOD_LABELS[sale.payment_method] ?? sale.payment_method : "—"}</td>
                    <td className="p-2 font-semibold">{formatMoney(sale.total_price)}</td>
                    <td className="p-2 text-muted-foreground">{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
                {!loading && !summary?.sales.length ? <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Aucune vente réglée sur cette période.</td></tr> : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={loading || !summary || (summary.totalGeneral === 0 && totalExits === 0) || !shopId}
          onClick={() => setClosureOpen(true)}
          className="bg-ivoirien bg-ivoirien-hover shadow-3d"
        >
          <Wallet className="size-4" /> Clôturer la caisse
        </Button>
      </div>

      <Card className="card-3d rounded-xl">
        <CardHeader><CardTitle>Historique des clôtures</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {closures.map((closure) => (
            <div key={closure.id} className="rounded-lg border p-4">
              <button
                type="button"
                onClick={() => setExpandedClosureId((current) => current === closure.id ? null : closure.id)}
                aria-expanded={expandedClosureId === closure.id}
                className="flex w-full flex-wrap items-center justify-between gap-3 bg-green-800 text-left text-white hover:bg-green-700"
              >
                <span>
                  <span className="block font-semibold">{formatDate(closure.created_at)}</span>
                  <span className="text-sm text-white/80">
                    {closure.period_start && closure.period_end
                      ? periodLabel({ start: new Date(closure.period_start), end: new Date(closure.period_end) })
                      : formatDate(closure.closure_date ?? closure.created_at)}
                  </span>
                </span>
                <span className="font-bold text-white">{formatMoney(closure.balance ?? closure.total_general)}</span>
              </button>
              {expandedClosureId === closure.id ? (
                <div className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                  <p>Entrées : <strong>{formatMoney(closure.total_entries ?? closure.total_general)}</strong></p>
                  <p>Sorties : <strong>{formatMoney(closure.total_exits ?? 0)}</strong></p>
                  <p>Solde : <strong>{formatMoney(closure.balance ?? closure.total_general)}</strong></p>
                  <p>Atelier : <strong>{formatMoney(closure.total_workshop)}</strong></p>
                  <p>Ventes : <strong>{formatMoney(closure.total_sales)}</strong></p>
                  {Object.entries(closure.breakdown).map(([method, amount]) => (
                    <p key={method}>{METHOD_LABELS[method] ?? method} : <strong>{formatMoney(amount)}</strong></p>
                  ))}
                  {closure.notes ? <p className="sm:col-span-2">Notes : {closure.notes}</p> : null}
                </div>
              ) : null}
            </div>
          ))}
          {!loading && closures.length === 0 ? <p className="text-sm text-muted-foreground">Aucune clôture enregistrée.</p> : null}
        </CardContent>
      </Card>

      {summary ? (
        <CashClosureModal
          open={closureOpen}
          onClose={() => setClosureOpen(false)}
          summary={summary}
          period={period}
          exitsTotal={totalExits}
          onSuccess={() => void load()}
        />
      ) : null}
      <CashReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      {ticketPayment ? (
        <WorkshopPaymentModal
          open={Boolean(ticketPayment)}
          onClose={() => setTicketPayment(null)}
          amount={ticketPayment.type === "entry" ? 2000 : Math.max(0, Number(ticketPayment.ticket.quote_amount ?? 0) - 2000)}
          title={ticketPayment.type === "entry" ? "Encaisser l'entrée" : "Encaisser le solde"}
          onSuccess={(method, amount) => void collectTicketPayment(method, amount)}
        />
      ) : null}
      <Dialog open={exitOpen} onOpenChange={(open) => !savingExit && setExitOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une sortie de caisse</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void saveExit(event)} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Type
              <select
                value={exitType}
                onChange={(event) => setExitType(event.target.value as "parts" | "expense")}
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="parts">Pièces</option>
                <option value="expense">Dépense diverse</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Montant
              <Input type="number" min="1" step="1" value={exitAmount} onChange={(event) => setExitAmount(event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Description
              <Input value={exitDescription} onChange={(event) => setExitDescription(event.target.value)} maxLength={240} placeholder="Commande fournisseur, électricité, internet…" />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExitOpen(false)} disabled={savingExit}>Annuler</Button>
              <Button type="submit" disabled={savingExit}>{savingExit ? "Enregistrement…" : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
