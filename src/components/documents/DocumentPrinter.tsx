import { FileDown, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export type PrintableDocumentType = "receipt" | "invoice" | "quote" | "certificate";

interface DocumentPrinterProps {
  documentType: PrintableDocumentType;
  documentId: string;
  data: Record<string, unknown>;
  onClose?: () => void;
}

interface DocumentPrintActionsProps {
  onClose?: (() => void) | undefined;
}

const documentTitles: Record<PrintableDocumentType, string> = {
  receipt: "Reçu de paiement",
  invoice: "Facture",
  quote: "Devis",
  certificate: "Attestation",
};

const fieldLabels: Record<string, string> = {
  reference: "Référence",
  id: "Identifiant",
  shop_name: "Boutique",
  shop_address: "Adresse",
  shop_phone: "Téléphone",
  date: "Date",
  created_at: "Date",
  clientName: "Client",
  client_name: "Client",
  clientWhatsapp: "WhatsApp",
  client_whatsapp: "WhatsApp",
  device: "Appareil",
  product: "Produit",
  product_name: "Produit",
  description: "Description",
  amount: "Montant payé",
  unit_price: "Prix unitaire",
  quantity: "Quantité",
  total: "Total",
  total_price: "Total",
  paymentMethod: "Mode de paiement",
  payment_method: "Mode de paiement",
  paymentStatus: "Statut du paiement",
  payment_status: "Statut du paiement",
  diagnosis: "Diagnostic",
};

function displayValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && /amount|price|total|fee/i.test(key)) {
    return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
  }
  if (typeof value === "string" && /date|_at$/i.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString("fr-FR");
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function DocumentPrintActions({ onClose }: DocumentPrintActionsProps) {
  return (
    <div className="document-printer-actions flex flex-wrap justify-end gap-2">
      {onClose ? (
        <Button type="button" variant="outline" onClick={onClose}>
          Fermer
        </Button>
      ) : null}
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        Imprimer
      </Button>
      <Button
        type="button"
        className="bg-ivoirien bg-ivoirien-hover"
        onClick={() => window.print()}
      >
        <FileDown className="size-4" />
        Télécharger PDF
      </Button>
    </div>
  );
}

export function DocumentPrinter({
  documentType,
  documentId,
  data,
  onClose,
}: DocumentPrinterProps) {
  const fields = Object.entries(data).filter(([, value]) => value !== undefined);
  const hasReference = fields.some(([key]) => key === "reference" || key === "id");

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .document-printer-page, .document-printer-page * { visibility: visible !important; }
          .document-printer-actions { display: none !important; }
          .document-printer-page {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 24px !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <article className="document-printer-page space-y-6 rounded-xl bg-white p-6 text-slate-950">
        <header className="border-b pb-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">GogoSoft</p>
          <h2 className="mt-2 text-2xl font-bold">{documentTitles[documentType]}</h2>
          {!hasReference ? (
            <p className="mt-1 text-sm">N° {documentId}</p>
          ) : null}
        </header>
        <dl className="space-y-3 text-sm">
          {fields.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 border-b pb-2">
              <dt className="font-medium">{fieldLabels[key] ?? key}</dt>
              <dd className="text-right">{displayValue(key, value)}</dd>
            </div>
          ))}
        </dl>
        {documentType === "certificate" ? (
          <div className="grid grid-cols-2 gap-8 pt-8 text-sm">
            <p className="border-t pt-2">Signature du bénéficiaire</p>
            <p className="border-t pt-2">Signature de la boutique</p>
          </div>
        ) : null}
        <DocumentPrintActions onClose={onClose} />
      </article>
    </>
  );
}
