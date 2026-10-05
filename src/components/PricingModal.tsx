import { useEffect, useState } from "react";
import { Check, Laptop, Monitor, Package, ShoppingCart, Smartphone } from "lucide-react";

import { StepIndicator } from "@/components/StepIndicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const selectedModulesDetails = availableModules.filter((module) => selectedModules.includes(module.code));
  const selectedPrice = selectedPricingPlan
    ? billingCycle === "annual"
      ? selectedPricingPlan.annual_price_fcfa
      : selectedPricingPlan.monthly_price_fcfa
    : 0;

  function toggleModule(code: string, checked: boolean) {
    setSelectedModules((current) =>
      checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
    );
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
      <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">
          {step === 1 ? "Étape 1 : sélection des modules" : "Étape 2 : choix du forfait"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {step === 1
            ? "Choisissez les modules adaptés à votre activité."
            : "Choisissez le forfait qui correspond à votre activité."}
        </DialogDescription>

        <div className="relative min-h-[640px] w-full overflow-hidden rounded-[28px] shadow-3d">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/75 via-black/60 to-green-900/70" />

          <div className="relative z-10 grid min-h-[640px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="hidden flex-col justify-between bg-slate-900/45 p-10 text-white backdrop-blur-sm lg:flex">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-orange-200/80">
                  Bienvenue
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight">GogoSoft</h2>
                <p className="mt-3 max-w-xs text-white/80">
                  Choisissez uniquement les modules dont vous avez besoin. Payez pour ce que vous
                  utilisez.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Sans engagement",
                  "7 jours gratuits",
                  "Paiement Wave / Orange Money",
                  "Domaine .com offert à l'année",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-white/90">
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-300 ring-1 ring-emerald-400/50">
                      ✓
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-white/60">
                Vous pourrez modifier vos modules à tout moment.
              </p>
            </aside>

            <section className="flex flex-col bg-white/95 p-6 backdrop-blur-md sm:p-8 lg:p-10">
              <div className="mb-6 flex items-center gap-3">
                <StepIndicator
                  number={1}
                  label="Modules"
                  active={step === 1}
                  completed={step > 1}
                />
                <div className="h-px flex-1 bg-slate-200" />
                <StepIndicator
                  number={2}
                  label="Forfait"
                  active={step === 2}
                  completed={step > 2}
                />
              </div>

              {loading ? (
                <div className="flex flex-1 items-center justify-center py-12">
                  <p className="text-sm text-slate-500">Chargement des modules…</p>
                </div>
              ) : loadError ? (
                <div className="flex flex-1 items-center justify-center py-12">
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {loadError}
                  </p>
                </div>
              ) : (
                <div className="animate-fadeIn flex flex-1 flex-col">
                  {step === 1 ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">Étape 1/2 : Que faites-vous ?</h3>
                        <p className="text-sm text-slate-500">
                          Cochez tout ce qui s&apos;applique à votre activité.
                        </p>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {availableModules.map((module) => {
                          const Icon = moduleIcons[module.icon as keyof typeof moduleIcons] ?? Package;
                          const checked = selectedModules.includes(module.code);
                          return (
                            <button
                              key={module.code}
                              type="button"
                              onClick={() => toggleModule(module.code, !checked)}
                              className={`group relative flex h-full min-h-[154px] cursor-pointer flex-col rounded-2xl border p-4 text-left transition duration-200 hover:scale-[1.02] ${
                                checked
                                  ? "border-orange-500 bg-orange-50 shadow-sm"
                                  : "border-slate-200 bg-white/80 hover:border-orange-300"
                              }`}
                            >
                              {checked ? (
                                <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                  <Check className="size-4" />
                                </span>
                              ) : null}
                              <div
                                className={`flex size-12 items-center justify-center rounded-xl ${
                                  checked ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <Icon className="size-5" />
                              </div>
                              <div className="mt-4 min-w-0">
                                <p className="font-semibold text-slate-900">{module.label}</p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                  {module.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">
                          {selectedModules.length} module(s) sélectionné(s)
                        </p>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {selectedModules.length > 0 ? "Prêt" : "À choisir"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">Étape 2/2 : Votre forfait</h3>
                        <p className="text-sm text-slate-500">
                          Voici le plan adapté à vos besoins.
                        </p>
                      </div>

                      {selectedPricingPlan ? (
                        <div className="mt-6 space-y-5">
                          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                              Votre plan
                            </p>
                            <div className="mt-3 flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-2xl font-bold text-slate-900">
                                  {selectedPricingPlan.plan_label}
                                </h4>
                                <p className="mt-1 text-sm text-slate-600">
                                  {selectedPricingPlan.min_modules}-{selectedPricingPlan.max_modules} modules
                                </p>
                              </div>
                              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                                Adapté
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {selectedModulesDetails.map((module) => (
                                <span
                                  key={module.code}
                                  className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                                >
                                  {module.label}
                                </span>
                              ))}
                            </div>
                          </section>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {(["monthly", "annual"] as const).map((cycle) => {
                              const price =
                                cycle === "annual"
                                  ? selectedPricingPlan.annual_price_fcfa
                                  : selectedPricingPlan.monthly_price_fcfa;
                              const isSelected = billingCycle === cycle;
                              return (
                                <button
                                  key={cycle}
                                  type="button"
                                  onClick={() => {
                                    setBillingCycle(cycle);
                                    setDomainIncluded(cycle === "annual");
                                  }}
                                  className={`min-h-[160px] rounded-2xl border p-4 text-left transition-all duration-200 ${
                                    isSelected
                                      ? "border-orange-500 bg-orange-50 shadow-sm ring-1 ring-orange-200"
                                      : "border-slate-200 bg-white/80 hover:border-orange-300"
                                  }`}
                                >
                                  <span className="text-lg font-semibold text-slate-900">
                                    {cycle === "monthly" ? "Mensuel" : "Annuel"}
                                  </span>
                                  <div className="mt-3">
                                    <span className="text-3xl font-bold text-slate-900">
                                      {price.toLocaleString("fr-FR")}
                                    </span>
                                    <span className="ml-1 text-sm font-medium text-slate-500">
                                      FCFA
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {cycle === "monthly" ? "/ mois" : "/ an"}
                                  </p>
                                  {cycle === "annual" ? (
                                    <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                      Économisez 2 mois · domaine .com inclus
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                          Aucun forfait ne correspond à votre sélection.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Retour
                  </button>
                ) : (
                  <div />
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    disabled={selectedModules.length === 0 || loading}
                    onClick={() => setStep(2)}
                    className={`ml-auto h-12 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d transition-all duration-200 hover:bg-ivoirien-hover ${
                      selectedModules.length === 0 ? "animate-pulse" : ""
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Continuer
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading || !selectedPricingPlan}
                    onClick={submitSelection}
                    className="ml-auto h-12 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d transition-all duration-200 hover:bg-ivoirien-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Souscrire
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
