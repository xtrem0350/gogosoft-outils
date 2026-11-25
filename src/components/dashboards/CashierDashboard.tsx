import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Receipt, ShoppingCart, Wallet } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { isDemoMode } from "@/services/demoService";
import {
  getCashExits,
  getCashSummary,
  getOpenCashSession,
  type CashSummary,
} from "@/services/cashService";
import { listSales, type Sale } from "@/services/salesService";
import { getTickets } from "@/services/workshopService";
import type { WorkshopTicket } from "@/types/database";

const PAYMENT_METHODS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN",
  moov: "Moov",
  unknown: "Non précisé",
};
const PAYMENT_COLORS = ["#166534", "#f97316", "#7c3aed", "#2563eb", "#0f766e", "#64748b"];

export function CashierDashboard() {
  const { shopId } = useCurrentShop();
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [exits, setExits] = useState<Awaited<ReturnType<typeof getCashExits>>>([]);
  const [sessionBalance, setSessionBalance] = useState<number | null>(null);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [pendingTickets, setPendingTickets] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setSummary(null);
      setExits([]);
      setSessionBalance(null);
      setPendingSales([]);
      setPendingTickets([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const period = { start: todayStart, end: now };
    void (async () => {
      const [nextSession, allSales, phoneTickets, computerTickets, nextSummary, nextExits] = await Promise.all([
        isDemoMode() ? Promise.resolve(null) : getOpenCashSession(shopId),
        listSales(shopId),
        getTickets(shopId, "phone"),
        getTickets(shopId, "computer"),
        getCashSummary(shopId, period),
        getCashExits(shopId, period),
      ]);
      let nextSessionBalance: number | null = null;
      if (nextSession) {
        const sessionStart = new Date(nextSession.opened_at);
        const sessionPeriod = { start: sessionStart, end: now };
        const [sessionSummary, sessionExits] =
          sessionStart.getTime() === todayStart.getTime()
            ? [nextSummary, nextExits]
            : await Promise.all([
                getCashSummary(shopId, sessionPeriod),
                getCashExits(shopId, sessionPeriod),
              ]);
        nextSessionBalance =
          nextSession.opening_amount +
          sessionSummary.totalGeneral -
          sessionExits.reduce((total, exit) => total + exit.amount, 0);
      }
      if (!active) return;
      setSummary(nextSummary);
      setExits(nextExits);
      setSessionBalance(nextSessionBalance);
      setPendingSales(
        allSales.filter(
          (sale) => sale.payment_status === "pending" || sale.payment_status === "awaiting_payment",
        ),
      );
      setPendingTickets(
        [...phoneTickets, ...computerTickets].filter(
          (ticket) =>
            ticket.status === "en_attente_caissier_entree" ||
            ticket.status === "en_attente_caissier_solde",
        ),
      );
    })()
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Impossible de charger la caisse.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  const totalExits = exits.reduce((total, exit) => total + exit.amount, 0);
  const paymentData = useMemo(
    () =>
      Object.entries(summary?.breakdown ?? {})
        .filter(([, amount]) => amount > 0)
        .map(([method, amount]) => ({
          method,
          name: PAYMENT_METHODS[method] ?? method,
          amount,
        })),
    [summary],
  );
  const formatAmount = (amount: number) => `${amount.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ma caisse</h1>
          <p className="text-sm text-slate-500">Suivi des encaissements et des sorties du jour</p>
        </div>
        <Button asChild>
          <Link to="/caisse" search={{ action: undefined, ticket: undefined }}>
            <Wallet className="mr-2 size-4" />
            Ouvrir la caisse
          </Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Encaissements du jour</CardTitle>
            <Receipt className="size-4 text-green-700" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{loading ? "…" : formatAmount(summary?.totalGeneral ?? 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Sorties du jour</CardTitle>
            <Wallet className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{loading ? "…" : formatAmount(totalExits)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Solde théorique de session</CardTitle>
            <Wallet className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{loading ? "…" : sessionBalance === null ? "Session fermée" : formatAmount(sessionBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Ventes en attente</CardTitle>
            <ShoppingCart className="size-4 text-violet-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold tabular-nums">{loading ? "…" : pendingSales.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chiffre d’affaires par moyen de paiement</CardTitle></CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun encaissement aujourd’hui.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} dataKey="amount" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                      {paymentData.map((item, index) => (
                        <Cell key={item.method} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatAmount(Number(value)), "Encaissé"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm">
              {paymentData.map((item, index) => (
                <span key={item.method} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }} />
                  {item.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>À encaisser</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : pendingSales.length + pendingTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente ou réparation en attente d’encaissement.</p>
            ) : (
              <div className="space-y-2">
                {pendingSales.slice(0, 5).map((sale) => (
                  <Link key={sale.id} to="/sales" className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <span className="min-w-0 truncate font-medium">{sale.product_name} · Vente</span>
                    <span className="shrink-0 text-sm font-semibold">{formatAmount(sale.total_price)}</span>
                  </Link>
                ))}
                {pendingTickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} to="/caisse" search={{ action: undefined, ticket: ticket.id }} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <span className="min-w-0 truncate font-medium">{ticket.ticket_number ?? ticket.client_name ?? "Réparation"} · Atelier</span>
                    <span className="shrink-0 text-sm font-semibold">{formatAmount(ticket.price_final ?? ticket.entry_fee ?? 0)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Raccourcis caisse</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/caisse" search={{ action: undefined, ticket: undefined }}><Wallet className="mr-2 size-4" />Ouvrir la caisse</Link></Button>
          <Button variant="outline" asChild><Link to="/caisse" search={{ action: undefined, ticket: undefined }}><Receipt className="mr-2 size-4" />Voir le récapitulatif</Link></Button>
          <Button asChild><Link to="/caisse" search={{ action: undefined, ticket: undefined }}><Download className="mr-2 size-4" />Exporter depuis la caisse</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
