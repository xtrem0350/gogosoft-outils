import { FileDown, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Shop } from "@/services/shopService";

export type PrintableDocumentType = "receipt" | "invoice" | "quote" | "certificate";

interface DocumentPrinterProps {
  documentType: PrintableDocumentType;
  documentId: string;
  data: Record<string, unknown>;
  onClose?: () => void;
  shop?: Shop | null;
}

interface DocumentPrintActionsProps {
  onClose?: (() => void) | undefined;
  reference?: string;
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

async function downloadDocumentPdf(reference: string, trigger: HTMLButtonElement): Promise<void> {
  const element =
    document.getElementById("document-content") ??
    trigger.closest<HTMLElement>(".workshop-ticket-preview, .workshop-print-ticket") ??
    document.querySelector<HTMLElement>(".workshop-ticket-preview, .workshop-print-ticket");
  if (!element) {
    toast.error("Aucun document à convertir en PDF.");
    return;
  }
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      ignoreElements: (candidate) =>
        candidate.classList.contains("no-print") ||
        candidate.classList.contains("document-printer-actions"),
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 10;
    const contentWidth = 190;
    const contentHeight = 277;
    const maxSliceHeight = (canvas.width * contentHeight) / contentWidth;
    let offset = 0;

    while (offset < canvas.height) {
      const sliceHeight = Math.min(maxSliceHeight, canvas.height - offset);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const context = pageCanvas.getContext("2d");
      if (!context) throw new Error("Impossible de préparer la page PDF.");
      context.drawImage(
        canvas,
        0,
        offset,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );
      if (offset > 0) pdf.addPage();
      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        contentWidth,
        (sliceHeight * contentWidth) / canvas.width,
      );
      offset += sliceHeight;
    }

    const safeReference = reference.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
    pdf.save(`recu-${safeReference || "document"}.pdf`);
  } catch (error) {
    console.error("[DocumentPrinter] PDF generation failed:", error);
    toast.error("Impossible de générer le PDF. Réessayez ou utilisez Imprimer.");
  }
}

export function DocumentPrintActions({ onClose, reference = "document" }: DocumentPrintActionsProps) {
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
        onClick={(event) => void downloadDocumentPdf(reference, event.currentTarget)}
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
  shop,
}: DocumentPrinterProps) {
  const fields = Object.entries(data).filter(([, value]) => value !== undefined);
  const hasReference = fields.some(([key]) => key === "reference" || key === "id");
  const reference = String(data["reference"] ?? data["id"] ?? documentId);
  const hasLegalFooter = Boolean(
    shop &&
      ((shop.raison_sociale && shop.capital_social != null) ||
        shop.rc ||
        shop.cc ||
        shop.adresse_bp ||
        shop.localisation_physique),
  );

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
      <article id="document-content" className="document-printer-page space-y-6 rounded-xl bg-white p-6 text-slate-950">
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
        <DocumentPrintActions onClose={onClose} reference={reference} />
        {hasLegalFooter && shop ? (
          <div className="mt-4 border-t border-gray-300 pt-2 text-xs text-gray-500">
            {shop.raison_sociale && shop.capital_social != null ? (
              <p>
                {shop.raison_sociale} — Capital{" "}
                {shop.capital_social.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
            {shop.rc || shop.cc ? (
              <p>
                {shop.rc ? <>RC {shop.rc}</> : null}
                {shop.rc && shop.cc ? " — " : null}
                {shop.cc ? <>CC {shop.cc}</> : null}
              </p>
            ) : null}
            {shop.adresse_bp || shop.localisation_physique ? (
              <p>
                {shop.adresse_bp ? <>BP {shop.adresse_bp}</> : null}
                {shop.adresse_bp && shop.localisation_physique ? " — " : null}
                {shop.localisation_physique}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    </>
  );
}
