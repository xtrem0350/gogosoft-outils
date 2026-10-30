import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashSummary } from "@/services/cashService";

interface CaisseRecapTabProps {
  summary: CashSummary | null;
  memberAvatars: Record<string, string>;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces", wave: "Wave", orange_money: "Orange Money", mtn: "MTN Money", moov: "Moov Money",
};
const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR");

export function CaisseRecapTab({ summary, memberAvatars }: CaisseRecapTabProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="card-3d min-w-0 rounded-xl">
        <CardHeader><CardTitle>Paiements atelier</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead><tr className="border-b text-muted-foreground"><th className="p-2">Ticket</th><th className="p-2">Mode</th><th className="p-2">Montant</th><th className="p-2">Date</th></tr></thead>
            <tbody>
              {(summary?.workshopPayments ?? []).map((payment) => (
                <tr key={payment.id} className="border-b last:border-0">
                  <td className="p-2 font-medium"><span className="inline-flex items-center gap-2">{payment.received_by && memberAvatars[payment.received_by] ? <img src={memberAvatars[payment.received_by]} alt="" className="size-8 rounded-full object-cover" /> : null}{payment.ticket_number ?? "—"}</span></td>
                  <td className="p-2">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                  <td className="p-2 font-semibold">{formatMoney(payment.amount)}</td>
                  <td className="p-2 text-muted-foreground">{formatDate(payment.created_at)}</td>
                </tr>
              ))}
              {!summary?.workshopPayments.length ? <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Aucun paiement atelier sur cette période.</td></tr> : null}
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
                <tr key={sale.id} className="border-b last:border-0"><td className="p-2 font-medium">{sale.product_name}</td><td className="p-2">{sale.payment_method ? METHOD_LABELS[sale.payment_method] ?? sale.payment_method : "—"}</td><td className="p-2 font-semibold">{formatMoney(sale.total_price)}</td><td className="p-2 text-muted-foreground">{formatDate(sale.created_at)}</td></tr>
              ))}
              {!summary?.sales.length ? <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Aucune vente réglée sur cette période.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
