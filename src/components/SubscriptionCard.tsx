/** Carte d'état de l'abonnement. */
import { CreditCard, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionSummary } from "@/services/subscriptionService";

interface SubscriptionCardProps {
  subscription: SubscriptionSummary | null;
}

const planStyles: Record<string, string> = {
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  mensuel: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  annuel: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

/** Affiche l'état de l'abonnement actuel et le solde de jours disponibles. */
export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const activeSubscription = subscription ?? {
    plan: "trial",
    status: "active",
    expires_at: null,
    isActive: true,
    daysRemaining: 7,
  };

  const planClass =
    planStyles[activeSubscription.plan as keyof typeof planStyles] ?? planStyles["trial"];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Abonnement actuel</p>
            <h3 className="mt-2 text-2xl font-bold capitalize">{activeSubscription.plan}</h3>
          </div>
          <Badge className={planClass}>{activeSubscription.plan}</Badge>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="size-4" />
            <span>Expiration</span>
          </div>
          <p className="mt-2 font-medium text-foreground">
            {activeSubscription.expires_at
              ? new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")
              : "7 jours"}
          </p>
          <p className="mt-1">{activeSubscription.daysRemaining} jours restants</p>
        </div>

        <Button className="w-full" variant="secondary">
          <Sparkles className="size-4" />
          Gérer l'abonnement
        </Button>
      </CardContent>
    </Card>
  );
}
