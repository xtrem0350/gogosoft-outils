import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashClosure, CashExit, CashSummary } from "@/services/cashService";

interface CaisseClosureTabProps {
  summary: CashSummary | null;
  exits: CashExit[];
  closures: CashClosure[];
  onClosure: () => void;
  loading?: boolean;
  shopId?: string | null;
  showHistory?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces", wave: "Wave", orange_money: "Orange Money", mtn: "MTN Money", moov: "Moov Money",
};
const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR");
const periodLabel = (start: Date, end: Date) => `${start.toLocaleDateString("fr-FR")} – ${end.toLocaleDateString("fr-FR")}`;

export function CaisseClosureTab({
  summary,
  exits,
  closures,
  onClosure,
  loading = false,
  shopId = null,
  showHistory = true,
}: CaisseClosureTabProps) {
  const [expandedClosureId, setExpandedClosureId] = useState<string | null>(null);
  const totalExits = exits.reduce((total, exit) => total + exit.amount, 0);

  return (
    <div className="space-y-6">
      {!showHistory ? <div className="flex justify-end">
          <Button type="button" disabled={loading || !summary || (summary.totalGeneral === 0 && totalExits === 0) || !shopId} onClick={onClosure} className="bg-ivoirien bg-ivoirien-hover shadow-3d">
            <Wallet className="size-4" /> Clôturer la caisse
          </Button>
      </div> : null}
      {showHistory ? (
        <Card className="card-3d rounded-xl">
          <CardHeader><CardTitle>Historique des clôtures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {closures.map((closure) => (
              <div key={closure.id} className="rounded-lg border p-4">
                <button type="button" onClick={() => setExpandedClosureId((current) => current === closure.id ? null : closure.id)} aria-expanded={expandedClosureId === closure.id} className="flex w-full flex-wrap items-center justify-between gap-3 bg-green-800 p-3 text-left text-white hover:bg-green-700">
                  <span>
                    <span className="block font-semibold">{formatDate(closure.created_at)}</span>
                    <span className="text-sm text-white/80">{closure.period_start && closure.period_end ? periodLabel(new Date(closure.period_start), new Date(closure.period_end)) : formatDate(closure.closure_date ?? closure.created_at)}</span>
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
                    {Object.entries(closure.breakdown).map(([method, amount]) => <p key={method}>{METHOD_LABELS[method] ?? method} : <strong>{formatMoney(amount)}</strong></p>)}
                    {closure.notes ? <p className="sm:col-span-2">Notes : {closure.notes}</p> : null}
                  </div>
                ) : null}
              </div>
            ))}
            {!loading && closures.length === 0 ? <p className="text-sm text-muted-foreground">Aucune clôture enregistrée.</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
