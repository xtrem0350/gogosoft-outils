import { Banknote, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import type { CashPeriod, CashSession, CashSummary } from "@/services/cashService";

interface CaisseStatsCardsProps {
  summary: CashSummary | null;
  totalExits: number;
  loading: boolean;
  period: CashPeriod;
  session: CashSession | null;
}

const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

export function CaisseStatsCards({ summary, totalExits, loading, period, session }: CaisseStatsCardsProps) {
  const sessionOpenedAt = session ? new Date(session.opened_at).getTime() : Number.NaN;
  const openingAmount =
    session && sessionOpenedAt >= period.start.getTime() && sessionOpenedAt <= period.end.getTime()
      ? session.opening_amount
      : 0;
  const balance = openingAmount + (summary?.totalGeneral ?? 0) - totalExits;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard title="Total entrées" value={loading ? "…" : formatMoney(summary?.totalGeneral ?? 0)} icon={Banknote} color="success" />
      <StatsCard title="Total sorties" value={loading ? "…" : formatMoney(totalExits)} icon={Wallet} color="warning" />
      <Card className="card-3d rounded-2xl border-0 bg-ivoirien text-white shadow-3d">
        <CardContent className="flex min-h-[104px] items-center gap-4 p-6">
          <Wallet className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase">Solde de la période (fonds d'ouverture inclus)</p>
            <p className="mt-2 truncate text-3xl font-extrabold">{loading ? "…" : formatMoney(balance)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
