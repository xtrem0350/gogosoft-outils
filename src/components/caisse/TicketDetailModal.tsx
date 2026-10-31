import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    ticket_number: string;
    client_name: string;
    client_whatsapp?: string;
    device_brand?: string;
    device_model?: string;
    device_imei?: string;
    description?: string;
    technicien_name?: string;
    quote_amount?: number;
    entry_fee?: number;
    status?: string;
  } | null;
  ticketType: "entry" | "final";
  onValidate: () => void;
}

const formatMoney = (amount: number) =>
  `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

export function TicketDetailModal({
  open,
  onClose,
  ticket,
  ticketType,
  onValidate,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  const whatsapp = ticket.client_whatsapp?.replace(/\D/g, "");
  const amount =
    ticketType === "entry"
      ? Number(ticket.entry_fee ?? 0)
      : Math.max(0, Number(ticket.quote_amount ?? 0) - Number(ticket.entry_fee ?? 0));

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="card-3d max-w-lg border-orange-100 shadow-3d">
        <DialogHeader>
          <DialogTitle>Détail fiche {ticket.ticket_number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <p><strong>N° fiche :</strong> {ticket.ticket_number}</p>
          <div>
            <strong>Client :</strong> {ticket.client_name}
            {whatsapp ? (
              <a
                className="ml-2 inline-flex items-center gap-1 text-green-700 underline"
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
          <p><strong>Appareil :</strong> {[ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "—"}{ticket.device_imei ? ` · IMEI ${ticket.device_imei}` : ""}</p>
          <p><strong>Panne :</strong> {ticket.description || "—"}</p>
          <p><strong>Technicien assigné :</strong> {ticket.technicien_name || "Non assigné"}</p>
          <p className="rounded-xl bg-gradient-to-r from-orange-50 via-white to-green-50 p-4 text-center text-xl font-bold">
            {formatMoney(amount)}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" className="bg-ivoirien bg-ivoirien-hover" onClick={onValidate}>Encaisser</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
