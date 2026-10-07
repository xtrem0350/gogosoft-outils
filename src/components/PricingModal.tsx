import { useEffect, useState } from "react";
import { Check, Laptop, Monitor, Package, ShoppingCart, Smartphone, Store } from "lucide-react";

import profileLogo from "@/assets/images/leprofile.png";
import { StepIndicator } from "@/components/StepIndicator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getAvailableModules,
  getDomainPricing,
  getLicenseForModuleCount,
  getLicensePricing,
  getModulePricing,
  getSubscriptionPricing,
  type ActivityModule,
  type DomainPricing,
  type LicensePricing,
  type ModulePricing,
  type ModulePurchaseSelection,
  type SubscriptionPricing,
} from "@/services/moduleService";

const WAVE_NUMBER = "2250758966156";

const moduleIcons = {
  Smartphone,
  Laptop,
  ShoppingCart,
  Monitor,
  Package,
  Store,
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
  const [modules, setModules] = useState<ModulePricing[]>([]);
  const [storefrontModules, setStorefrontModules] = useState<ActivityModule[]>([]);
  const [licenses, setLicenses] = useState<LicensePricing[]>([]);
  const [appDurations, setAppDurations] = useState<SubscriptionPricing[]>([]);
  const [shopDurations, setShopDurations] = useState<SubscriptionPricing[]>([]);
  const [domains, setDomains] = useState<DomainPricing[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedStorefronts, setSelectedStorefronts] = useState<string[]>([]);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [domainCode, setDomainCode] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    setStep(1);
    void Promise.all([
      getModulePricing(),
      getAvailableModules(),
      getLicensePricing(),
      getSubscriptionPricing("app"),
      getSubscriptionPricing("shop"),
      getDomainPricing(),
    ])
      .then(([modulePricing, activityModules, licenseList, appList, shopList, domainList]) => {
        if (!active) return;
        setModules(modulePricing);
        setStorefrontModules(activityModules.filter((module) => module.code.startsWith("shop_")));
        setLicenses(licenseList);
        setAppDurations(appList);
        setShopDurations(shopList);
        setDomains(domainList);
        if (appList.length > 0) {
          setDurationMonths((current) =>
            appList.some((item) => item.duration_months === current)
              ? current
              : (appList[0]?.duration_months ?? current),
          );
        }
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

  const selectionCount = selectedModules.length + selectedStorefronts.length;
  const license =
    selectedModules.length > 0 ? getLicenseForModuleCount(licenses, selectedModules.length) : null;
  const appSubscription =
    appDurations.find((item) => item.duration_months === durationMonths) ?? null;
  const shopSubscriptionCode =
    selectedStorefronts.length === 0
      ? null
      : `shop_${Math.min(selectedStorefronts.length, 2)}_${durationMonths}m`;
  const shopSubscription = shopDurations.find((item) => item.code === shopSubscriptionCode) ?? null;
  const domain = domains.find((item) => item.code === domainCode) ?? null;
  const totalPrice =
    (license?.price_fcfa ?? 0) +
    (appSubscription?.price_fcfa ?? 0) +
    (shopSubscription?.price_fcfa ?? 0) +
    (domain?.annual_price_fcfa ?? 0);

  function toggleModule(code: string, checked: boolean) {
    setSelectedModules((current) =>
      checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
    );
  }

  function toggleStorefront(code: string, checked: boolean) {
    setSelectedStorefronts((current) =>
      checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
    );
  }

  function renderModuleCard(
    code: string,
    label: string,
    description: string | null,
    icon: string | null,
    priceLabel: string | null,
    storefront: boolean,
  ) {
    const selected = storefront ? selectedStorefronts : selectedModules;
    const checked = selected.includes(code);
    const Icon = moduleIcons[icon as keyof typeof moduleIcons] ?? Package;
    return (
      <button
        key={code}
        type="button"
        aria-pressed={checked}
        onClick={() =>
          storefront ? toggleStorefront(code, !checked) : toggleModule(code, !checked)
        }
        className={`group relative flex min-h-[130px] cursor-pointer flex-col rounded-lg border p-4 text-left transition duration-200 hover:border-orange-300 ${
          checked ? "border-orange-500 bg-orange-50 shadow-sm" : "border-slate-200 bg-white/80"
        }`}
      >
        {checked ? (
          <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="size-4" />
          </span>
        ) : null}
        <span
          className={`flex size-11 items-center justify-center rounded-lg ${checked ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}
        >
          <Icon className="size-5" />
        </span>
        <span className="mt-3 font-semibold text-slate-900">{label}</span>
        <span className="mt-1 text-sm leading-relaxed text-slate-600">{description}</span>
        {priceLabel ? (
          <span className="mt-2 text-xs font-semibold text-orange-700">{priceLabel}</span>
        ) : null}
      </button>
    );
  }

  function requestOpenChange(nextOpen: boolean) {
    if (!isBlocking || nextOpen) onOpenChange(nextOpen);
  }

  function buildSelection(trial: boolean): ModulePurchaseSelection {
    return {
      moduleCodes: selectedModules,
      storefrontCodes: selectedStorefronts,
      licenseCode: license?.code ?? null,
      subscriptionCode: appSubscription?.code ?? null,
      shopSubscriptionCode: shopSubscription?.code ?? null,
      durationMonths,
      domainCode,
      priceFcfa: trial ? 0 : totalPrice,
      trial,
    };
  }

  function submitSelection(trial: boolean) {
    if (selectionCount === 0) return;
    if (!trial && totalPrice <= 0) return;
    onCreateAccount(buildSelection(trial));
  }

  function payWithWave() {
    const message = `Bonjour, je souhaite payer ma licence GogoSoft (${totalPrice.toLocaleString("fr-FR")} FCFA) par Wave.`;
    window.open(`https://wa.me/${WAVE_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    submitSelection(false);
  }

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: "Étape 1/3 : vos modules",
    2: "Étape 2/3 : votre abonnement",
    3: "Étape 3/3 : récapitulatif",
  };

  return (
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{stepTitles[step]}</DialogTitle>
        <DialogDescription className="sr-only">
          Choisissez vos modules, la durée de votre abonnement puis validez le récapitulatif.
        </DialogDescription>

        <div className="relative flex max-h-[90vh] min-h-[min(500px,90vh)] w-full flex-col overflow-hidden rounded-[28px] shadow-3d">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/75 via-black/60 to-green-900/70" />

          <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="hidden min-h-0 flex-col justify-between gap-6 overflow-y-auto bg-slate-900/45 p-6 text-white backdrop-blur-sm lg:flex">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 size-32 overflow-hidden rounded-full border-2 border-white/20 shadow-3d">
                  <img src={profileLogo} alt="GogoSoft" className="size-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold">GogoSoft</h2>
                <p className="mt-1 text-sm text-white/70">Tools Manager</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold">Bienvenue sur GogoSoft</h3>
                <p className="mt-2 max-w-xs text-sm text-white/80">
                  Choisissez uniquement les modules dont vous avez besoin. Payez pour ce que vous
                  utilisez.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Sans engagement",
                  "1 jour d'essai gratuit",
                  "Paiement Wave / Orange Money",
                  "Domaine .com ou .ci en option",
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

            <section className="flex min-h-0 flex-col overflow-hidden bg-white/95 p-4 backdrop-blur-md sm:p-6">
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
                  label="Abonnement"
                  active={step === 2}
                  completed={step > 2}
                />
                <div className="h-px flex-1 bg-slate-200" />
                <StepIndicator number={3} label="Résumé" active={step === 3} completed={false} />
              </div>

              {loading ? (
                <div className="flex flex-1 items-center justify-center py-12">
                  <p className="text-sm text-slate-500">Chargement des tarifs…</p>
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
                <div className="animate-fadeIn min-h-0 flex-1 overflow-y-auto">
                  {step === 1 ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">{stepTitles[1]}</h3>
                        <p className="text-sm text-slate-500">
                          Sélectionnez les modules applicatifs et les vitrines nécessaires.
                        </p>
                      </div>

                      <h4 className="mt-5 text-sm font-bold uppercase text-slate-700">
                        Application
                      </h4>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {modules.map((module) =>
                          renderModuleCard(
                            module.code,
                            module.label,
                            module.description,
                            module.icon,
                            `${module.monthly_price_fcfa.toLocaleString("fr-FR")} FCFA/mois`,
                            false,
                          ),
                        )}
                      </div>
                      <h4 className="mt-5 text-sm font-bold uppercase text-slate-700">Vitrine</h4>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {storefrontModules.map((module) =>
                          renderModuleCard(
                            module.code,
                            module.label,
                            module.description,
                            module.icon,
                            null,
                            true,
                          ),
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">
                          {selectionCount} option(s) sélectionnée(s)
                        </p>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {selectionCount > 0 ? "Prêt" : "À choisir"}
                        </span>
                      </div>
                    </>
                  ) : step === 2 ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">{stepTitles[2]}</h3>
                        <p className="text-sm text-slate-500">
                          Votre licence est calculée automatiquement. Choisissez la durée.
                        </p>
                      </div>

                      {license ? (
                        <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                            Votre licence
                          </p>
                          <p className="mt-3 font-semibold text-slate-900">
                            {license.label} · {license.price_fcfa.toLocaleString("fr-FR")} FCFA
                          </p>
                          {license.description ? (
                            <p className="mt-1 text-sm text-slate-600">{license.description}</p>
                          ) : null}
                        </section>
                      ) : null}

                      <h4 className="mt-5 text-sm font-bold uppercase text-slate-700">
                        Durée de l'abonnement
                      </h4>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        {appDurations.map((duration) => (
                          <button
                            key={duration.code}
                            type="button"
                            aria-pressed={durationMonths === duration.duration_months}
                            onClick={() => setDurationMonths(duration.duration_months)}
                            className={`min-h-28 rounded-lg border p-4 text-left transition ${
                              durationMonths === duration.duration_months
                                ? "border-orange-600 bg-orange-50 ring-1 ring-orange-300"
                                : "border-slate-200 bg-white hover:border-orange-300"
                            }`}
                          >
                            <span className="text-sm font-semibold text-slate-700">
                              {duration.duration_months} mois
                            </span>
                            <span className="mt-2 block text-xl font-bold text-slate-900">
                              {duration.price_fcfa.toLocaleString("fr-FR")} FCFA
                            </span>
                            {duration.description ? (
                              <span className="text-xs text-slate-500">{duration.description}</span>
                            ) : null}
                          </button>
                        ))}
                      </div>

                      {shopSubscription ? (
                        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                          Vitrine ({selectedStorefronts.length} côté(s), {durationMonths} mois) :{" "}
                          {shopSubscription.price_fcfa.toLocaleString("fr-FR")} FCFA
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">{stepTitles[3]}</h3>
                        <p className="text-sm text-slate-500">
                          Vérifiez votre sélection avant de payer ou de démarrer l'essai.
                        </p>
                      </div>

                      <h4 className="mt-5 text-sm font-bold uppercase text-slate-700">
                        Nom de domaine (optionnel)
                      </h4>
                      <div className="mt-2 space-y-2">
                        {domains.map((item) => (
                          <label
                            key={item.code}
                            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-sm"
                          >
                            <span>
                              <span className="block font-semibold text-slate-800">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-slate-500">
                                {item.annual_price_fcfa.toLocaleString("fr-FR")} FCFA/an · SSL
                                inclus gratuitement
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={domainCode === item.code}
                              onChange={(event) =>
                                setDomainCode(event.target.checked ? item.code : null)
                              }
                              className="size-5 accent-orange-600"
                            />
                          </label>
                        ))}
                      </div>

                      <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Récapitulatif
                        </p>
                        <dl className="mt-3 space-y-2 text-sm">
                          {license ? (
                            <div className="flex justify-between">
                              <dt className="text-slate-600">{license.label}</dt>
                              <dd className="font-medium text-slate-900">
                                {license.price_fcfa.toLocaleString("fr-FR")} FCFA
                              </dd>
                            </div>
                          ) : null}
                          {appSubscription ? (
                            <div className="flex justify-between">
                              <dt className="text-slate-600">{appSubscription.label}</dt>
                              <dd className="font-medium text-slate-900">
                                {appSubscription.price_fcfa.toLocaleString("fr-FR")} FCFA
                              </dd>
                            </div>
                          ) : null}
                          {shopSubscription ? (
                            <div className="flex justify-between">
                              <dt className="text-slate-600">{shopSubscription.label}</dt>
                              <dd className="font-medium text-slate-900">
                                {shopSubscription.price_fcfa.toLocaleString("fr-FR")} FCFA
                              </dd>
                            </div>
                          ) : null}
                          {domain ? (
                            <div className="flex justify-between">
                              <dt className="text-slate-600">{domain.label}</dt>
                              <dd className="font-medium text-slate-900">
                                {domain.annual_price_fcfa.toLocaleString("fr-FR")} FCFA/an
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                            <dt className="text-slate-900">TOTAL</dt>
                            <dd className="text-orange-700">
                              {totalPrice.toLocaleString("fr-FR")} FCFA
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <div className="mt-5 space-y-3">
                        <button
                          type="button"
                          disabled={selectionCount === 0 || totalPrice <= 0}
                          onClick={payWithWave}
                          className="h-12 w-full rounded-xl bg-ivoirien px-5 font-semibold shadow-3d transition-all duration-200 hover:bg-ivoirien-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Payer par Wave
                        </button>
                        <button
                          type="button"
                          disabled={selectionCount === 0}
                          onClick={() => submitSelection(true)}
                          className="h-12 w-full rounded-xl border border-emerald-600 bg-white px-5 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Démarrer l'essai gratuit (24h)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="sticky bottom-0 mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white/95 pt-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as 1 | 2)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Retour
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    disabled={selectionCount === 0 || loading}
                    onClick={() => setStep((step + 1) as 2 | 3)}
                    className={`ml-auto h-12 rounded-xl bg-ivoirien px-5 font-semibold shadow-3d transition-all duration-200 hover:bg-ivoirien-hover ${
                      selectionCount === 0 ? "animate-pulse" : ""
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Continuer
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
