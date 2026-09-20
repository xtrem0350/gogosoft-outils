import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPayment, simulatePaymentSuccess } from "@/services/paymentService";
import { getMySubscription, type SubscriptionSummary } from "@/services/subscriptionService";

export const Route = createFileRoute("/abonnement")({
  component: AbonnementPage,
});

const plans = [
  { key: "trial", label: "Trial", price: "Gratuit", days: 7, description: "Essai de 7 jours" },
  { key: "mensuel", label: "Mensuel", price: "5 000 FCFA", days: 30, description: "Abonnement mensuel" },
  { key: "annuel", label: "Annuel", price: "50 000 FCFA", days: 365, description: "Abonnement annuel" },
] as const;

function AbonnementPage() {
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);

  useEffect(() => {
    void getMySubscription().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  async function subscribe(plan: (typeof plans)[number]) {
    try {
      const { data: userData } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        toast.error("Utilisateur non authentifié.");
        return;
      }

      const amount = plan.key === "mensuel" ? 5000 : plan.key === "annuel" ? 50000 : 0;
      const payment = await createPayment(userId, plan.key, amount);
      await simulatePaymentSuccess(payment.id);
      const next = await getMySubscription();
      setSubscription(next);
      toast.success("Paiement simulé avec succès.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de souscrire.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Abonnement</p>
        <h1 className="mt-2 text-3xl font-bold">Gestion de l'abonnement</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SubscriptionCard subscription={subscription} />

        <Card>
          <CardContent className="space-y-5 p-5">
            {plans.map((plan) => (
              <div key={plan.key} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{plan.label}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">{plan.days} jours</p>
                  </div>
                </div>
                {plan.key !== "trial" ? (
                  <Button className="mt-4 w-full" onClick={() => void subscribe(plan)}>
                    <CreditCard className="size-4" />
                    Souscrire
                  </Button>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-success">
                    <Check className="size-4" />
                    Essai inclus
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                try {
                  const { data: userData } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
                  const userId = userData.user?.id;
                  if (!userId) {
                    toast.error("Utilisateur non authentifié.");
                    return;
                  }

                  const payment = await createPayment(userId, "mensuel", 5000);
                  await simulatePaymentSuccess(payment.id);
                  const next = await getMySubscription();
                  setSubscription(next);
                  toast.success("Paiement réussi simulé.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "La simulation a échoué.");
                }
              }}
            >
              Simuler un paiement réussi
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
