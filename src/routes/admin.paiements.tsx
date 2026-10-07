import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAllPayments,
  getAllTenants,
  type AdminPayment,
  type AdminTenant,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/paiements")({ component: PaymentsPage });

function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([getAllPayments(100), getAllTenants()])
      .then(([rows, people]) => {
        setPayments(rows);
        setTenants(people);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);
  const names = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));
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
                {["Date", "Abonné", "Montant", "Mode", "Statut"].map((label) => (
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
                  <td className="px-4 py-3">{names.get(payment.user_id) ?? payment.user_id}</td>
                  <td className="px-4 py-3">{payment.amount.toLocaleString("fr-FR")} FCFA</td>
                  <td className="px-4 py-3">{payment.method}</td>
                  <td className="px-4 py-3">{payment.status}</td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
