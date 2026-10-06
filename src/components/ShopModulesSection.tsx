/** Section « Mes modules » : modules activés de l'atelier et forfait calculé. */
import {
  Laptop,
  Monitor,
  Package,
  Plus,
  ShoppingCart,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notifyShopModulesChanged } from "@/hooks/useShopModules";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disableShopModule,
  enableShopModules,
  getAvailableModules,
  getModulePricingSummary,
  getPricingPlans,
  getShopModules,
  syncSubscriptionModules,
  type ActivityModule,
  type PricingPlan,
} from "@/services/moduleService";

const ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  ShoppingCart,
  Monitor,
  Package,
};

/** Icône Lucide d'un module. */
function ModuleIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className="size-5 text-primary" />;
}

/** Gestion des modules de l'atelier actif. */
export function ShopModulesSection({ shopId }: { shopId: string | null }) {
  const [all, setAll] = useState<ActivityModule[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [modules, pricing, active] = await Promise.all([
        getAvailableModules(),
        getPricingPlans(),
        getShopModules(shopId),
      ]);
      setAll(modules);
      setPlans(pricing);
      setEnabled(active);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les modules.");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(code: string) {
    if (!shopId) return;
    try {
      await enableShopModules(shopId, [code]);
      const next = [...new Set([...enabled, code])];
      setEnabled(next);
      notifyShopModulesChanged(shopId);
      await syncSubscriptionModules(next);
      setAddOpen(false);
      toast.success("Module ajouté.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Ajout impossible.");
    }
  }

  async function remove(code: string) {
    if (!shopId) return;
    try {
      await disableShopModule(shopId, code);
      const next = enabled.filter((currentCode) => currentCode !== code);
      setEnabled(next);
      notifyShopModulesChanged(shopId);
      await syncSubscriptionModules(next);
      toast.success("Module désactivé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Désactivation impossible.");
    }
  }

  if (!shopId) {
    return <p className="text-sm text-muted-foreground">Sélectionnez un atelier.</p>;
  }
  if (loading) return <p className="text-sm text-muted-foreground">Chargement des modules...</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => void load()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const active = all.filter((m) => enabled.includes(m.code));
  const available = all.filter((m) => !enabled.includes(m.code));
  const appCodes = active
    .filter((module) => !module.code.startsWith("shop_"))
    .map((module) => module.code);
  const storefrontCodes = active
    .filter((module) => module.code.startsWith("shop_"))
    .map((module) => module.code);
  const pricing = getModulePricingSummary(plans, appCodes, storefrontCodes);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Mes modules</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Gérez les modules que vous utilisez.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tarifs actuels :{" "}
            {pricing.monthlyPrice > 0 ? (
              <Badge variant="secondary">
                {pricing.monthlyPrice.toLocaleString("fr-FR")} FCFA/mois ·{" "}
                {pricing.annualPrice.toLocaleString("fr-FR")} FCFA/an
              </Badge>
            ) : (
              "aucun"
            )}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={available.length === 0}>
          <Plus className="size-4" />
          Ajouter un module
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Les changements prendront effet au prochain cycle de facturation.
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun module activé.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((m) => (
              <div key={m.code} className="flex items-start gap-3 rounded-lg border p-3">
                <ModuleIcon name={m.icon} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                <Badge variant="secondary">Actif</Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Désactiver
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Désactiver « {m.label} » ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Les pages de ce module disparaîtront du menu. Vos données sont conservées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void remove(m.code)}>
                        Désactiver
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un module</DialogTitle>
            <DialogDescription>
              Choisissez une activité à ajouter à votre atelier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {available.map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => void add(m.code)}
                className="flex w-full items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent"
              >
                <ModuleIcon name={m.icon} />
                <div>
                  <p className="font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
