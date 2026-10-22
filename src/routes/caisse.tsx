import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarDays, Wallet } from "lucide-react";
import { toast } from "sonner";

import { CashClosureModal } from "@/components/CashClosureModal";
import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getTeamMembers } from "@/services/teamService";
import {
  getCashClosures,
  getCashSummary,
  type CashClosure,
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
  const [preset, setPreset] = useState<PeriodPreset>("today");
  const [customStart, setCustomStart] = useState(() => localDateValue(new Date()));
  const [customEnd, setCustomEnd] = useState(() => localDateValue(new Date()));
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [closureOpen, setClosureOpen] = useState(false);
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
      const [nextSummary, nextClosures, members] = await Promise.all([
        getCashSummary(shopId, period),
        getCashClosures(shopId),
        getTeamMembers(shopId),
      ]);
      setSummary(nextSummary);
      setClosures(nextClosures);
      setMemberAvatars(Object.fromEntries(
        members.filter((member) => member.avatar_url).map((member) => [member.user_id, member.avatar_url as string]),
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger la caisse.");
    } finally {
      setLoading(false);
    }
  }, [period, shopId]);

  useEffect(() => {
    if (!shopLoading) void load();
  }, [load, shopLoading]);

  const paymentMethods = Object.keys(METHOD_LABELS);

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

      <Card className="card-3d rounded-xl">
        <CardHeader><CardTitle>Détail par mode de paiement</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {paymentMethods.map((method) => (
            <div key={method} className="flex justify-between gap-3 rounded-lg border bg-white p-3">
              <span>{METHOD_LABELS[method]}</span>
              <span className="font-bold">{formatMoney(summary?.breakdown[method] ?? 0)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

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
          disabled={loading || !summary || summary.totalGeneral === 0 || !shopId}
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
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="block font-semibold">{formatDate(closure.created_at)}</span>
                  <span className="text-sm text-muted-foreground">{periodLabel({ start: new Date(closure.period_start), end: new Date(closure.period_end) })}</span>
                </span>
                <span className="font-bold text-orange-800">{formatMoney(closure.total_general)}</span>
              </button>
              {expandedClosureId === closure.id ? (
                <div className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
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
          onSuccess={() => void load()}
        />
      ) : null}
    </div>
  );
}
