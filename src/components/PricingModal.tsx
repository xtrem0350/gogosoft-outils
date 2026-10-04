import { useEffect, useState } from "react";
import { Check, Globe2, Laptop, Monitor, Package, ShoppingCart, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAvailableModules,
  getPlanForModuleCount,
  getPricingPlans,
  type ActivityModule,
  type ModulePurchaseSelection,
  type PricingPlan,
} from "@/services/moduleService";

const moduleIcons = {
  Smartphone,
  Laptop,
  ShoppingCart,
  Monitor,
  Package,
};

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: (selection: ModulePurchaseSelection) => void;
  isBlocking?: boolean;
}

export function PricingModal({
  open,
  onOpenChange,
  onCreateAccount,
  isBlocking = false,
}: PricingModalProps) {
  const [availableModules, setAvailableModules] = useState<ActivityModule[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [domainIncluded, setDomainIncluded] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [domainMessage, setDomainMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    setStep(1);
    void Promise.all([getAvailableModules(), getPricingPlans()])
      .then(([modules, pricingPlans]) => {
        if (!active) return;
        setAvailableModules(modules);
        setPlans(pricingPlans);
        setSelectedModules((current) =>
          current.filter((code) => modules.some((module) => module.code === code)),
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Chargement impossible.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const selectedPricingPlan = getPlanForModuleCount(plans, selectedModules.length);
  const selectedPrice = selectedPricingPlan
    ? billingCycle === "annual"
      ? selectedPricingPlan.annual_price_fcfa
      : selectedPricingPlan.monthly_price_fcfa + (domainIncluded ? 10000 : 0)
    : 0;

  function toggleModule(code: string, checked: boolean) {
    setSelectedModules((current) =>
      checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
    );
  }

  function verifyDomain() {
    const normalizedName = domainName.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalizedName)) {
      setDomainMessage("Saisissez un nom valide, sans espace ni ponctuation.");
      return;
    }
    setDomainMessage("Format valide. La disponibilité sera confirmée lors de l'activation.");
  }

  function requestOpenChange(nextOpen: boolean) {
    if (!isBlocking || nextOpen) onOpenChange(nextOpen);
  }

  function submitSelection() {
    if (!selectedPricingPlan) return;
    onCreateAccount({
      moduleCodes: selectedModules,
      planCode: selectedPricingPlan.plan_code,
      billingCycle,
      priceFcfa: selectedPrice,
      domainIncluded,
    });
  }

  return (
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent
        className={`max-h-[90dvh] max-w-5xl overflow-y-auto ${isBlocking ? "[&>button]:hidden" : ""}`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Étape {step}/2 : {step === 1 ? "Que faites-vous ?" : "Votre forfait"}
          </DialogTitle>
          <DialogDescription>
            {isBlocking
              ? "Votre abonnement a expiré. Choisissez un forfait pour continuer."
              : "Choisissez les activités de votre boutique et le rythme de facturation."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement des modules…</p>
        ) : loadError ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {loadError}
          </p>
        ) : (
          <>
            {step === 1 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableModules.map((module) => {
                  const Icon = moduleIcons[module.icon as keyof typeof moduleIcons] ?? Package;
                  const checked = selectedModules.includes(module.code);
                  return (
                    <label
                      key={module.code}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                        checked ? "border-orange-500 bg-orange-50" : "hover:border-orange-300"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleModule(module.code, value === true)}
                        className="mt-1"
                      />
                      <Icon className="mt-0.5 size-5 shrink-0 text-orange-700" />
                      <span className="min-w-0">
                        <span className="block font-medium">{module.label}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {module.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPricingPlan ? (
                  <section className="rounded-md border p-4">
                    <p className="font-semibold">Forfait {selectedPricingPlan.plan_label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedModules.length} module(s) sélectionné(s)
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(["monthly", "annual"] as const).map((cycle) => {
                        const price =
                          cycle === "annual"
                            ? selectedPricingPlan.annual_price_fcfa
                            : selectedPricingPlan.monthly_price_fcfa;
                        return (
                          <button
                            key={cycle}
                            type="button"
                            aria-pressed={billingCycle === cycle}
                            onClick={() => {
                              setBillingCycle(cycle);
                              setDomainIncluded(cycle === "annual");
                            }}
                            className={`flex min-h-28 flex-col items-start rounded-md border p-4 text-left ${
                              billingCycle === cycle
                                ? "border-orange-500 bg-orange-50 ring-1 ring-orange-300"
                                : "hover:border-orange-300"
                            }`}
                          >
                            <span className="font-semibold">
                              {cycle === "monthly" ? "Mensuel" : "Annuel"}
                            </span>
                            <span className="mt-2 text-xl font-bold">
                              {price.toLocaleString("fr-FR")} FCFA
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {cycle === "monthly" ? "/ mois" : "/ an · .com inclus"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <p role="alert" className="text-sm text-destructive">
                    Aucun forfait ne correspond à ce nombre de modules.
                  </p>
                )}

                <section className="space-y-3 rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="domain-included"
                      checked={billingCycle === "annual" || domainIncluded}
                      disabled={billingCycle === "annual"}
                      onCheckedChange={(checked) => setDomainIncluded(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="domain-included" className="leading-5">
                      {billingCycle === "annual"
                        ? "Nom de domaine .com inclus dans la formule annuelle"
                        : "Ajouter un nom de domaine .com (+ 10 000 FCFA/an)"}
                    </Label>
                  </div>
                  {domainIncluded && billingCycle === "monthly" ? (
                    <div className="space-y-2">
                      <Label htmlFor="domain-name">Nom de domaine</Label>
                      <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-0 flex-1 basis-48">
                          <Globe2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="domain-name"
                            value={domainName}
                            onChange={(event) => {
                              setDomainName(event.target.value);
                              setDomainMessage("");
                            }}
                            placeholder="ex: monatelier-reparation"
                            className="pr-14 pl-9"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            .com
                          </span>
                        </div>
                        <Button type="button" variant="outline" onClick={verifyDomain}>
                          Vérifier la disponibilité
                        </Button>
                      </div>
                      {domainMessage ? (
                        <p aria-live="polite" className="text-xs text-muted-foreground">
                          {domainMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="border-t pt-3 text-lg font-bold">
                    Total : {selectedPrice.toLocaleString("fr-FR")} FCFA
                  </p>
                </section>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {!isBlocking ? (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
              ) : null}
              {step === 2 ? (
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Modifier mes modules
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={loading || (step === 1 ? selectedModules.length === 0 : !selectedPricingPlan)}
                onClick={step === 1 ? () => setStep(2) : submitSelection}
                className="bg-ivoirien"
              >
                {step === 1 ? "Continuer" : "Souscrire"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
