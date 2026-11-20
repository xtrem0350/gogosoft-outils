import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  getAllSubscriptionPayments,
  validateCashPayment,
  type AdminSubscriptionPayment,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/paiements")({ component: PaymentsPage });

function PaymentsPage() {
  const [payments, setPayments] = useState<AdminSubscriptionPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminSubscriptionPayment | null>(null);
  const [validating, setValidating] = useState(false);

  async function refreshPayments() {
    setError(null);
    setPayments(await getAllSubscriptionPayments());
  }

  useEffect(() => {
    void refreshPayments()
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);

  async function confirmCashPayment() {
    if (!selectedPayment) return;
    setValidating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const adminId = authData.user?.id;
      if (!adminId) throw new Error("Session SuperAdmin introuvable.");

      await validateCashPayment(selectedPayment.id, adminId);
      setSelectedPayment(null);
      toast.success("Paiement validé et abonnement activé.");
      try {
        await refreshPayments();
      } catch (reason) {
        toast.error(
          reason instanceof Error
            ? `Paiement validé, mais la liste n'a pas pu être actualisée : ${reason.message}`
            : "Paiement validé, mais la liste n'a pas pu être actualisée.",
        );
      }
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Impossible de valider le paiement.",
      );
    } finally {
      setValidating(false);
    }
  }

  function paymentStatusClass(status: string) {
    if (status === "paid") return "bg-green-100 text-green-800";
    if (status === "en_attente_paiement_espece") return "bg-orange-100 text-orange-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Tous les paiements"
        subtitle="Historique des règlements de la plateforme"
        icon={CreditCard}
      />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Owner / boutique", "Montant", "Mode", "Statut", "Action"].map((label) => (
                  <th key={label} className="px-4 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {new Date(payment.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.owner_name}</div>
                    <div className="text-xs text-muted-foreground">{payment.shop_name}</div>
                  </td>
                  <td className="px-4 py-3">{payment.amount.toLocaleString("fr-FR")} FCFA</td>
                  <td className="px-4 py-3">{payment.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${paymentStatusClass(payment.payment_status)}`}>
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {payment.payment_status === "en_attente_paiement_espece" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                        disabled={validating}
                      >
                        Marquer comme payé
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <AlertDialog
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => {
          if (!open && !validating) setSelectedPayment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le paiement en espèces</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez-vous avoir reçu{" "}
              <strong>
                {selectedPayment?.amount.toLocaleString("fr-FR") ?? "0"} FCFA
              </strong>{" "}
              en espèces ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={validating}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={validating}
              onClick={(event) => {
                event.preventDefault();
                void confirmCashPayment();
              }}
            >
              {validating ? "Validation…" : "Confirmer la réception"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
