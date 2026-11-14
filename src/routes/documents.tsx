import { createFileRoute } from "@tanstack/react-router";
import { FileText, MessageCircle, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DocumentPrinter } from "@/components/documents/DocumentPrinter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { listSales, type Sale } from "@/services/salesService";

export const Route = createFileRoute("/documents")({ component: DocumentsPage });

const formatMoney = (amount: number) =>
  `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

function DocumentsPage() {
  const { shop, shopId } = useCurrentShop();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    if (!shopId) {
      setSales([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void listSales(shopId)
      .then((items) => {
        if (active) setSales(items.slice(0, 10));
      })
      .catch((error: unknown) => {
        console.error("[documents] Impossible de charger les ventes.", error);
        if (active) {
          setLoadError(true);
          toast.error("Impossible de charger les documents.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  const selectedIsPaid = selectedSale?.payment_status === "paid";
  const selectedDocument = selectedSale
    ? {
        reference: selectedSale.id.slice(0, 8).toUpperCase(),
        shop_name: shop?.name ?? "GogoSoft",
        date: selectedSale.created_at,
        client_name: selectedSale.client_name,
        client_whatsapp: selectedSale.client_whatsapp,
        product_name: selectedSale.product_name,
        description: selectedSale.product_description,
        quantity: selectedSale.quantity,
        unit_price: selectedSale.unit_price,
        total_price: selectedSale.total_price,
        payment_method: selectedSale.payment_method,
        payment_status: selectedSale.payment_status,
      }
    : null;

  function sendByWhatsApp() {
    if (!selectedSale?.client_whatsapp) {
      toast.error("Aucun numéro WhatsApp n'est renseigné pour ce client.");
      return;
    }
    const message = `Bonjour ${selectedSale.client_name ?? ""}, voici votre ${
      selectedIsPaid ? "reçu" : "facture"
    } ${formatMoney(selectedSale.total_price)} pour ${selectedSale.product_name}. ${
      shop?.name ? `Merci de votre confiance — ${shop.name}.` : ""
    }`;
    window.open(
      buildWhatsappLink(selectedSale.client_whatsapp, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section className="space-y-4 p-4">
      <header>
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos 10 dernières factures et reçus.
        </p>
      </header>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement des documents…</p>
      ) : loadError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">
          Impossible de charger les documents. Réessayez plus tard.
        </p>
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun document pour le moment.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sales.map((sale) => {
            const isPaid = sale.payment_status === "paid";
            return (
              <li key={sale.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent"
                  onClick={() => setSelectedSale(sale)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ReceiptText className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {isPaid ? "Reçu" : "Facture"} · {sale.product_name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {sale.client_name || "Client"} ·{" "}
                      {new Date(sale.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatMoney(sale.total_price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={selectedSale !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSale(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedIsPaid ? "Détail du reçu" : "Détail de la facture"}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && selectedDocument ? (
            <DocumentPrinter
              documentType={selectedIsPaid ? "receipt" : "invoice"}
              documentId={selectedSale.id}
              data={selectedDocument}
              onClose={() => setSelectedSale(null)}
            />
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              onClick={sendByWhatsApp}
              disabled={!selectedSale?.client_whatsapp}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              <MessageCircle className="size-4" />
              Envoyer par WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
