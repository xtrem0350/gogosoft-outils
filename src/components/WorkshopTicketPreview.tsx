import { Button } from "@/components/ui/button";
import type { WorkshopTicket } from "@/types/database";

export type WorkshopTicketPreviewMode = "reception" | "diagnostic" | "final";
export type WorkshopTicketPreviewAudience = "internal" | "client";

interface WorkshopTicketPreviewProps {
  ticket: WorkshopTicket;
  mode: WorkshopTicketPreviewMode;
  audience: WorkshopTicketPreviewAudience;
  onClose: () => void;
  diagnosticDetails?: string;
  estimatedPickupDate?: string;
  technicianName?: string | undefined;
  finalPaidAmount?: number;
  shopName?: string | undefined;
  shopAddress?: string | null | undefined;
  shopPhone?: string | null | undefined;
  laborCost?: number;
  partsCost?: number;
  otherCost?: number;
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
}

function amountLabel(value: number | null | undefined): string {
  return `${new Intl.NumberFormat("fr-FR").format(value ?? 0)} FCFA`;
}

export function WorkshopTicketPreview({
  ticket,
  mode,
  audience,
  onClose,
  diagnosticDetails,
  estimatedPickupDate,
  technicianName,
  finalPaidAmount,
  shopName,
  shopAddress,
  shopPhone,
  laborCost,
  partsCost,
  otherCost,
}: WorkshopTicketPreviewProps) {
  const deviceName = [ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "—";
  const parts = ticket.pieces_consommees ?? [];
  const isClientReceipt = audience === "client";

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .workshop-ticket-preview, .workshop-ticket-preview * { visibility: visible !important; }
          .workshop-ticket-preview .no-print { display: none !important; }
          .workshop-ticket-preview {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <article className="workshop-ticket-preview space-y-5 bg-white p-6 text-black">
        <div className="no-print flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
        <header className="border-b border-black pb-4">
          {isClientReceipt ? (
            <div className="mb-4">
              <h2 className="text-xl font-bold">{shopName ?? "Atelier"}</h2>
              {shopAddress ? <p>{shopAddress}</p> : null}
              {shopPhone ? <p>Téléphone : {shopPhone}</p> : null}
            </div>
          ) : null}
          <h2 className="text-2xl font-bold">
            {isClientReceipt
              ? "Reçu client"
              : mode === "reception"
              ? "Reçu de réception"
              : mode === "diagnostic"
                ? "Diagnostic & devis"
                : "Reçu de livraison"}
          </h2>
          <p className="mt-1 text-sm">Fiche : {ticket.ticket_number ?? ticket.id}</p>
        </header>

        <section className="space-y-1 text-sm">
          <h3 className="font-bold">Réception</h3>
          <p>Date/heure : {dateLabel(ticket.created_at)}</p>
          <p>Client : {ticket.client_name ?? "—"} · WhatsApp : {ticket.client_whatsapp ?? "—"}</p>
          <p>Appareil : {deviceName}</p>
          <p>Version système : {ticket.device_os_version ?? "—"}</p>
          <p>IMEI : {ticket.device_imei ?? "—"}</p>
          <p>Pannes : {ticket.issues.length ? ticket.issues.join(", ") : "—"}</p>
          <p>
            Frais d'entrée : {amountLabel(ticket.entry_fee)} ·{" "}
            {ticket.entry_fee_paid ? "payés" : "non payés"}
          </p>
        </section>

        {mode !== "reception" ? (
          <section className="space-y-1 border-t border-gray-300 pt-4 text-sm">
            <h3 className="font-bold">Diagnostic et devis</h3>
            <p className="whitespace-pre-wrap">Diagnostic : {ticket.diagnostic_notes ?? "—"}</p>
            {!isClientReceipt && diagnosticDetails ? (
              <p className="whitespace-pre-wrap">
                <strong>Détail du devis :</strong> {diagnosticDetails}
              </p>
            ) : null}
            {isClientReceipt ? (
              <table className="w-full border-collapse text-left">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 font-normal">Main d'œuvre</th>
                    <td className="py-1 text-right">{amountLabel(laborCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 font-normal">Pièces</th>
                    <td className="py-1 text-right">{amountLabel(partsCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 font-normal">Divers</th>
                    <td className="py-1 text-right">{amountLabel(otherCost)}</td>
                  </tr>
                  <tr className="font-bold">
                    <th className="py-1">Total du devis</th>
                    <td className="py-1 text-right">{amountLabel(ticket.price_estimate)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Total du devis : {amountLabel(ticket.price_estimate)}</p>
            )}
            {estimatedPickupDate ? <p>Retrait estimé : {dateLabel(estimatedPickupDate)}</p> : null}
          </section>
        ) : null}

        {mode === "final" ? (
          <section className="space-y-1 border-t border-gray-300 pt-4 text-sm">
            <h3 className="font-bold">Réparation et livraison</h3>
            {!isClientReceipt ? (
              <>
                <p>Technicien : {technicianName ?? ticket.technicien_id ?? "—"}</p>
                <p>Outils : {ticket.outils_utilises?.join(", ") || "—"}</p>
                <p className="whitespace-pre-wrap">Notes internes : {ticket.notes ?? "—"}</p>
                <p>
                  Pièces consommées :{" "}
                  {parts.length
                    ? parts
                        .map((part) =>
                          `${part.name} × ${part.qty}${
                            part.unit_price !== undefined
                              ? ` (${amountLabel(part.unit_price)} / unité)`
                              : ""
                          }`,
                        )
                        .join(", ")
                    : "—"}
                </p>
              </>
            ) : (
              <p>Date de livraison : {dateLabel(ticket.delivered_at)}</p>
            )}
            <p>
              {ticket.price_final_paid ? "Total final payé : " : "Total final à régler : "}
              {amountLabel(finalPaidAmount ?? ticket.price_final ?? ticket.price_estimate)}
            </p>
            {!isClientReceipt ? <p>Date de livraison : {dateLabel(ticket.delivered_at)}</p> : null}
            <p className="pt-4 font-bold">
              {ticket.price_final_paid ? "Reçu acquitté" : "Reçu en attente du paiement"}
            </p>
            {isClientReceipt ? (
              <div className="grid grid-cols-2 gap-8 pt-8">
                <p className="border-t border-black pt-2">Signature du client</p>
                <p className="border-t border-black pt-2">Signature de la boutique</p>
              </div>
            ) : (
              <p className="mt-6 border-t border-black pt-2">Signature</p>
            )}
          </section>
        ) : null}
      </article>
    </>
  );
}
