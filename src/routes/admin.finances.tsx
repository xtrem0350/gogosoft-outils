import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type CashEntry = {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  created_at: string;
  client_name: string;
};

export const Route = createFileRoute("/admin/finances")({ component: FinancesPage });

function FinancesPage() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preset, setPreset] = useState<"today" | "week" | "month" | "custom">("month");

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("super_admin_cash_entries")
        .select("id, invoice_id, amount, currency, payment_method, payment_reference, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscription_invoices")
        .select("total_amount")
        .eq("payment_status", "en_attente_paiement_espece"),
      supabase
        .from("subscription_invoices")
        .select("id, user_id"),
    ])
      .then(async ([entriesResult, pendingResult, invoicesResult]) => {
        if (!active) return;
        if (entriesResult.error) throw entriesResult.error;
        if (pendingResult.error) throw pendingResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        const rawEntries = (entriesResult.data ?? []) as Array<Omit<CashEntry, "client_name">>;
        const userIds = [
          ...new Set(
            (invoicesResult.data ?? [])
              .filter((invoice) => rawEntries.some((entry) => entry.invoice_id === invoice.id))
              .map((invoice) => invoice.user_id),
          ),
        ];
        const profilesResult = userIds.length
          ? await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", userIds)
          : { data: [] };
        if ("error" in profilesResult && profilesResult.error) throw profilesResult.error;
        const profiles = profilesResult.data;
        const userNames = new Map(
          (profiles ?? []).map((profile) => [
            profile.id,
            profile.full_name ?? profile.email ?? profile.id,
          ]),
        );
        const invoicesById = new Map(
          (invoicesResult.data ?? []).map((invoice) => [
            invoice.id,
            invoice.user_id,
          ]),
        );
        setEntries(
          rawEntries.map((entry) => ({
            ...entry,
            client_name:
              userNames.get(invoicesById.get(entry.invoice_id) ?? "") ??
              "Client inconnu",
          })),
        );
        setPending(
          (pendingResult.data ?? []).reduce(
            (total, invoice) => total + Number(invoice.total_amount || 0),
            0,
          ),
        );
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Impossible de charger les finances.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startWeek.setHours(0, 0, 0, 0);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = useMemo(() => entries.filter((entry) => {
    const date = new Date(entry.created_at);
    if (preset === "today") return date >= startToday;
    if (preset === "week") return date >= startWeek;
    if (preset === "month") return date >= startMonth;
    if (from && date < new Date(`${from}T00:00:00`)) return false;
    if (to && date > new Date(`${to}T23:59:59.999`)) return false;
    return true;
  }), [entries, from, preset, startMonth, startToday, startWeek, to]);

  const sumSince = (start: Date) =>
    entries
      .filter((entry) => new Date(entry.created_at) >= start)
      .reduce((total, entry) => total + Number(entry.amount), 0);
  const today = sumSince(startToday);
  const week = sumSince(startWeek);
  const month = sumSince(startMonth);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title="Revenus & caisse" subtitle="Encaissements manuels de la plateforme" icon={TrendingUp} />
      {error ? <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Caisse SuperAdmin</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Aujourd'hui" value={`${today.toLocaleString("fr-FR")} FCFA`} icon={TrendingUp} />
          <StatsCard title="Cette semaine" value={`${week.toLocaleString("fr-FR")} FCFA`} icon={TrendingUp} />
          <StatsCard title="Ce mois" value={`${month.toLocaleString("fr-FR")} FCFA`} icon={TrendingUp} />
          <StatsCard title="En attente" value={`${pending.toLocaleString("fr-FR")} FCFA`} icon={TrendingUp} color="warning" />
        </div>
        <Card>
          <CardHeader><CardTitle>Paiements reçus</CardTitle></CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            <div className="grid max-w-xl grid-cols-2 gap-3">
              <select
                value={preset}
                onChange={(event) =>
                  setPreset(event.target.value as "today" | "week" | "month" | "custom")
                }
                className="h-10 rounded-md border px-3"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="custom">Période personnalisée</option>
              </select>
              {preset === "custom" ? (
                <>
                  <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                  <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                </>
              ) : null}
            </div>
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  {["Date", "Facture", "Client", "Montant", "Méthode", "Référence"].map((label) =>
                    <th key={label} className="px-3 py-2">{label}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-3 py-3">{new Date(entry.created_at).toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-3">{entry.invoice_id}</td>
                    <td className="px-3 py-3">{entry.client_name}</td>
                    <td className="px-3 py-3">{entry.amount.toLocaleString("fr-FR")} {entry.currency}</td>
                    <td className="px-3 py-3">{entry.payment_method}</td>
                    <td className="px-3 py-3">{entry.payment_reference ?? "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Aucun paiement reçu pour cette période.</td></tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
