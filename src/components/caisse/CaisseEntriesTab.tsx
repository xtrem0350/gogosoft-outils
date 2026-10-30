import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalePaymentMethod } from "@/services/salesService";
import type { CashSummary } from "@/services/cashService";
import type { CashReceipt } from "@/components/CashReceiptModal";

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
const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR");

interface PendingSale {
  id: string;
  product_name: string;
  client_name: string | null;
  total_price: number;
  created_at: string;
}

interface WorkshopTicket {
  id: string;
  ticket_number: string;
  client_name: string;
  quote_amount?: number;
}

interface CaisseEntriesTabProps {
  summary: CashSummary | null;
  pendingSales: PendingSale[];
  paymentMethodsBySale: Record<string, SalePaymentMethod>;
  onPaymentMethodChange: (saleId: string, method: SalePaymentMethod) => void;
  onCollectSale: (saleId: string) => void;
  onReceipt: (receipt: CashReceipt) => void;
  entryTickets: WorkshopTicket[];
  finalTickets: WorkshopTicket[];
  onCollectTicket: (ticket: WorkshopTicket, type: "entry" | "final") => void;
  onTicketDetail: (ticket: WorkshopTicket, type: "entry" | "final") => void;
  sessionOpen: boolean;
  onAddEntry: () => void;
}

export function CaisseEntriesTab({
  summary,
  pendingSales,
  paymentMethodsBySale,
  onPaymentMethodChange,
  onCollectSale,
  onReceipt,
  entryTickets,
  finalTickets,
  onCollectTicket,
  onTicketDetail,
  sessionOpen,
  onAddEntry,
}: CaisseEntriesTabProps) {
  return (
    <div className="space-y-6">
      <Card className="card-3d rounded-xl">
        <CardHeader>
          <CardTitle>Entrées en caisse</CardTitle>
          <p className="text-sm text-muted-foreground">Paiements de réparation et ventes encaissées.</p>
          <Button type="button" onClick={onAddEntry} disabled={!sessionOpen}>Ajouter une entrée</Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <h3 className="font-semibold">Paiements réparation</h3>
            {summary?.workshopPayments.length ? summary.workshopPayments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{payment.payment_type === "final" ? "Solde réparation" : "Acompte réparation"} · {payment.ticket_number ?? "Ticket"}</p>
                  <p className="text-sm text-muted-foreground">{payment.client_name ?? "Client —"} · {payment.device_model ?? "Appareil —"} · {METHOD_LABELS[payment.method] ?? payment.method}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(payment.amount)}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => onReceipt({ reference: payment.ticket_number ?? payment.id, clientName: payment.client_name ?? "", device: payment.device_model ?? "", amount: payment.amount, date: payment.created_at })}>
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
                <div><p className="font-medium">{sale.product_name}</p><p className="text-sm text-muted-foreground">{sale.client_name ?? "Client —"} · Vente encaissée</p></div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(sale.total_price)}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => onReceipt({ reference: sale.id, clientName: sale.client_name ?? "", device: sale.product_name, amount: sale.total_price, date: sale.created_at })}>
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
                <div><p className="font-medium">{sale.product_name}</p><p className="text-sm text-muted-foreground">{sale.client_name ?? "Client —"} · {formatDate(sale.created_at)}</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{formatMoney(sale.total_price)}</span>
                  <select aria-label={`Mode de paiement pour ${sale.product_name}`} value={paymentMethodsBySale[sale.id] ?? "cash"} onChange={(event) => onPaymentMethodChange(sale.id, event.target.value as SalePaymentMethod)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {CASHIER_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                  </select>
                  <Button type="button" size="sm" onClick={() => onCollectSale(sale.id)}>Encaisser</Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aucun paiement vente en attente.</p>}
          </div>
        </CardContent>
      </Card>
      <Card className="card-3d rounded-xl">
        <CardHeader><CardTitle>Fiches atelier à encaisser</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[...entryTickets.map((ticket) => ({ ticket, type: "entry" as const, amount: 2000 })), ...finalTickets.map((ticket) => ({ ticket, type: "final" as const, amount: Math.max(0, Number(ticket.quote_amount ?? 0) - 2000) }))].map(({ ticket, type, amount }) => (
            <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <Button type="button" variant="ghost" className="h-auto p-0 font-medium underline-offset-4 hover:underline" onClick={() => onTicketDetail(ticket, type)}>{ticket.ticket_number}</Button>
                <p className="text-xs text-muted-foreground">{ticket.client_name} · {type === "entry" ? "Entrée" : "Solde"} · {formatMoney(amount)}</p>
              </div>
              <Button size="sm" onClick={() => onCollectTicket(ticket, type)}>{type === "entry" ? "Encaisser l'entrée" : "Encaisser le solde"}</Button>
            </div>
          ))}
          {entryTickets.length === 0 && finalTickets.length === 0 ? <p className="text-sm text-muted-foreground">Aucune fiche atelier en attente.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
