import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Receipt, ShoppingCart, Wallet } from "lucide-react";

import { useCurrentShop } from "@/hooks/useCurrentShop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSales, type Sale } from "@/services/salesService";
import { getTodayWorkshopPayments } from "@/services/workshopService";

type TodayPayment = Awaited<ReturnType<typeof getTodayWorkshopPayments>>[number];

export function CashierDashboard() {
  const { shopId } = useCurrentShop();
  const [payments, setPayments] = useState<TodayPayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setPayments([]);
      setSales([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    void Promise.all([getTodayWorkshopPayments(shopId), listSales(shopId)])
      .then(([todayPayments, allSales]) => {
        if (!active) return;
        setPayments(todayPayments.slice(0, 5));
        setSales(
          allSales
            .filter((sale) => {
              const createdAt = new Date(sale.created_at).getTime();
              return (
                sale.payment_status === "paid" &&
                createdAt >= todayStart.getTime() &&
                createdAt < todayEnd.getTime()
              );
            })
            .sort((left, right) => right.created_at.localeCompare(left.created_at))
            .slice(0, 5),
        );
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Impossible de charger les encaissements.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_price, 0);
  const totalDay = totalPayments + totalSales;
  const formatAmount = (amount: number) => `${amount.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ma caisse</h1>
          <p className="text-sm text-slate-500">Encaissements du jour</p>
        </div>
        <Button asChild>
          <Link to="/caisse" search={{ action: undefined, ticket: undefined }}>
            <Wallet className="mr-2 size-4" />
            Ouvrir la caisse
          </Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Atelier</CardTitle>
            <Receipt className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatAmount(totalPayments)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ventes payées</CardTitle>
            <ShoppingCart className="size-4 text-green-800" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatAmount(totalSales)}</div></CardContent>
        </Card>
        <Card className="bg-ivoirien text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">TOTAL DU JOUR</CardTitle>
            <Wallet className="size-4" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatAmount(totalDay)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Derniers paiements atelier</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun paiement aujourd’hui.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between gap-3 border-b pb-2 text-sm">
                    <span>{payment.ticket_number ?? payment.client_name ?? payment.method}</span>
                    <span className="font-medium">{formatAmount(payment.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dernières ventes payées</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : sales.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune vente payée aujourd’hui.</p>
            ) : (
              <div className="space-y-2">
                {sales.map((sale) => (
                  <div key={sale.id} className="flex justify-between gap-3 border-b pb-2 text-sm">
                    <span>{sale.product_name}</span>
                    <span className="font-medium">{formatAmount(sale.total_price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
