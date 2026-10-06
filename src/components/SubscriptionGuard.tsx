import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { PricingModal } from "@/components/PricingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { notifyShopModulesChanged, useShopModules } from "@/hooks/useShopModules";
import { applyModuleSelection } from "@/services/moduleService";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, loading } = useSubscription();
  const { user } = useAuth();
  const { shopId, refresh: refreshShop } = useCurrentShop();
  const { refresh: refreshModules } = useShopModules();
  const [savingSelection, setSavingSelection] = useState(false);

  async function selectModules(selection: Parameters<typeof applyModuleSelection>[1]) {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    setSavingSelection(true);
    try {
      const shop = await applyModuleSelection(user.id, selection);
      await refreshShop(user.id, true);
      notifyShopModulesChanged(shop.id);
      if (shopId === shop.id) await refreshModules();
      toast.success("Votre sélection a été activée.");
      await navigate({ to: "/" });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Activation impossible.");
    } finally {
      setSavingSelection(false);
    }
  }

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
        <PricingModal
          open
          isBlocking
          onOpenChange={() => undefined}
          onCreateAccount={(selection) => void selectModules(selection)}
        />
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
            <Button
              className="w-full"
              disabled={savingSelection}
              onClick={() => void navigate({ to: "/abonnement" })}
            >
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
