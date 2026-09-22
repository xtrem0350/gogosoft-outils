import { useLocation, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, loading } = useSubscription();

  if (location.pathname === "/abonnement") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Vérification de l'abonnement…
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-6">
        <Card className="w-full border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-destructive">
                Abonnement
              </p>
              <h1 className="mt-3 text-3xl font-bold">Votre abonnement a expiré</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Réactivez votre accès pour continuer à gérer votre atelier et vos clients.
              </p>
            </div>
            <Button className="w-full" onClick={() => void navigate({ to: "/abonnement" })}>
              Renouveler
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
