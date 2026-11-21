import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { validateCashPayment } from "@/services/adminService";
import { useUserRole } from "@/hooks/useUserRole";

type InvoiceStatus = "en_attente_paiement_espece" | "payee_espece" | "annulee";
type Invoice = {
  id: string;
  user_id: string;
  shop_id: string | null;
  total_amount: number;
  payment_method: "cash" | "wave" | "orange_money" | "mtn_momo";
  payment_reference: string | null;
  payment_status: InvoiceStatus;
  created_at: string;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
};

export const Route = createFileRoute("/admin/paiements")({ component: PaymentsPage });

function PaymentsPage() {
  const { isSuperAdmin } = useUserRole();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Invoice["payment_method"]>("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [validating, setValidating] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function refreshInvoices() {
    setError(null);
    const { data, error: loadError } = await supabase
      .from("subscription_invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) throw loadError;

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      shop_id: string | null;
      total_amount: number;
      payment_method: Invoice["payment_method"];
      payment_reference: string | null;
      payment_status: InvoiceStatus;
      created_at: string;
    }>;
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;

    const names = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        {
          name: profile.full_name ?? profile.email ?? profile.id,
          email: profile.email,
          phone: profile.phone,
        },
      ]),
    );
    setInvoices(rows.map((row) => ({
      ...row,
      owner_name: names.get(row.user_id)?.name ?? row.user_id,
      owner_email: names.get(row.user_id)?.email ?? null,
      owner_phone: names.get(row.user_id)?.phone ?? null,
    })));
  }

  useEffect(() => {
    void refreshInvoices().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Chargement impossible."),
    );
  }, []);

  async function confirmCashPayment() {
    if (!selected) return;
    if (paymentMethod !== "cash" && !paymentReference.trim()) {
      toast.error("La référence de transaction est obligatoire.");
      return;
    }
    setValidating(true);
    try {
      await validateCashPayment(selected.id, paymentMethod, paymentReference.trim() || null);
      toast.success("Paiement validé et abonnement activé.");
      setSelected(null);
      setPaymentReference("");
      await refreshInvoices();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de valider la facture.");
    } finally {
      setValidating(false);
    }
  }

  async function cancelInvoice(invoice: Invoice) {
    if (!isSuperAdmin) {
      toast.error("Réservé au SuperAdmin.");
      return;
    }
    if (!window.confirm("Annuler cette facture ?")) return;
    const { error: cancelError } = await supabase
      .from("subscription_invoices")
      .update({ payment_status: "annulee", updated_at: new Date().toISOString() })
      .eq("id", invoice.id)
      .eq("payment_status", "en_attente_paiement_espece");
    if (cancelError) {
      toast.error(cancelError.message);
      return;
    }
    toast.success("Facture annulée.");
    await refreshInvoices();
  }

  function relaunchWhatsApp(invoice: Invoice) {
    if (!invoice.owner_phone) {
      toast.error("Aucun numéro WhatsApp enregistré.");
      return;
    }
    const phone = invoice.owner_phone.replace(/\D/g, "");
    const invoiceLink = `${window.location.origin}/admin/paiements?invoice=${encodeURIComponent(invoice.id)}`;
    const message =
      `Bonjour ${invoice.owner_name}, merci de régler la facture ${invoice.id} ` +
      `de ${invoice.total_amount.toLocaleString("fr-FR")} FCFA. ` +
      `Lien facture : ${invoiceLink}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const haystack = `${invoice.owner_name} ${invoice.owner_email ?? ""}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && invoice.payment_status !== statusFilter) return false;
    const date = new Date(invoice.created_at);
    if (from && date < new Date(`${from}T00:00:00`)) return false;
    if (to && date > new Date(`${to}T23:59:59.999`)) return false;
    return true;
  }), [from, invoices, query, statusFilter, to]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title="Toutes les factures" subtitle="Validation des paiements manuels" icon={CreditCard} />
      {error ? <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un client..." />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | InvoiceStatus)} className="h-10 rounded-md border px-3">
              <option value="all">Tous les statuts</option>
              <option value="en_attente_paiement_espece">En attente</option>
              <option value="payee_espece">Payée</option>
              <option value="annulee">Annulée</option>
            </select>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  {["Date", "Client", "Montant", "Méthode choisie", "Référence", "Statut", "Actions"].map((label) =>
                    <th key={label} className="px-3 py-2">{label}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="px-3 py-3">{new Date(invoice.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{invoice.owner_name}</div>
                      <div className="text-xs text-muted-foreground">{invoice.owner_email ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3">{invoice.total_amount.toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-3 py-3">{invoice.payment_method}</td>
                    <td className="px-3 py-3">{invoice.payment_reference ?? "—"}</td>
                    <td className="px-3 py-3">{invoice.payment_status}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isSuperAdmin && invoice.payment_status === "en_attente_paiement_espece" ? (
                          <>
                            <Button size="sm" onClick={() => { setSelected(invoice); setPaymentMethod(invoice.payment_method); setPaymentReference(invoice.payment_reference ?? ""); }}>
                              Marquer comme payé
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void cancelInvoice(invoice)}>
                              Annuler
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => relaunchWhatsApp(invoice)}>
                              Relancer WhatsApp
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">Aucune facture trouvée.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(selected)} onOpenChange={(open) => !open && !validating && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le paiement manuel</AlertDialogTitle>
            <AlertDialogDescription>
              Choisissez le mode réellement encaissé et indiquez une référence pour mobile money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3">
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Invoice["payment_method"])} className="h-10 rounded-md border px-3">
              <option value="cash">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
            </select>
            {paymentMethod !== "cash" ? (
              <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Référence de transaction" />
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={validating}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={validating} onClick={(event) => { event.preventDefault(); void confirmCashPayment(); }}>
              {validating ? "Validation…" : "Confirmer la réception"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
