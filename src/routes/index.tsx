import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Gift,
  Globe,
  Laptop,
  Lock,
  ShoppingCart,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import profileLogo from "@/assets/images/leprofile.png";
import { Button } from "@/components/ui/button";
import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { WELCOME_PRICING } from "@/constants/pricing";
import { useAuth } from "@/hooks/useAuth";
import {
  consumeDemoExpiredNotice,
  isDemoMode,
  selectedDemoModuleIds,
  startDemo,
} from "@/services/demoService";
import { type ModuleId } from "@/types/modules";

const WELCOME_MODULES: Array<{
  id: ModuleId;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "orange" | "green";
}> = [
  {
    id: "reparation-telephone",
    title: "Réparation Téléphone",
    description: "Diagnostics et interventions rapides",
    icon: Smartphone,
    tone: "orange",
  },
  {
    id: "reparation-pc",
    title: "Réparation PC",
    description: "Maintenance et suivi de machines",
    icon: Laptop,
    tone: "orange",
  },
  {
    id: "vente-telephone",
    title: "Vente Téléphone",
    description: "Catalogue et ventes mobiles",
    icon: ShoppingCart,
    tone: "green",
  },
  {
    id: "vente-pc",
    title: "Vente PC",
    description: "Ordinateurs et accessoires de bureau",
    icon: ShoppingCart,
    tone: "green",
  },
  {
    id: "vitrine-telephone",
    title: "Vitrine Téléphone",
    description: "Boutique en ligne mobile",
    icon: Globe,
    tone: "orange",
  },
  {
    id: "vitrine-pc",
    title: "Vitrine PC",
    description: "Boutique en ligne ordinateur",
    icon: Globe,
    tone: "orange",
  },
];

const STORAGE_KEY = "gogosoft.welcome.selectedModules";
const PLAN_STORAGE_KEY = "gogosoft.welcome.selectedPlan";

function readSelectedModules(): ModuleId[] {
  if (typeof window === "undefined") return [];
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is ModuleId =>
      WELCOME_MODULES.some((module) => module.id === value),
    );
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function readSelectedPlan(): string | null {
  if (typeof window === "undefined") return null;
  const savedPlan = window.sessionStorage.getItem(PLAN_STORAGE_KEY);
  return WELCOME_PRICING.some((plan) => plan.id === savedPlan) ? savedPlan : null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GogoSoft Tools Manager — Gestion d'atelier de réparation" },
      {
        name: "description",
        content:
          "Choisissez vos domaines (réparation, vente, vitrine), démarrez une démo d'un jour ou un essai gratuit de sept jours.",
      },
      { property: "og:title", content: "GogoSoft Tools Manager — Gestion d'atelier de réparation" },
      {
        property: "og:description",
        content: "Réparations, clients, ventes et boutique en ligne pour réparateurs. Essai gratuit 1 jour.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setActiveModules } = useActiveModules();
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(readSelectedModules);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(readSelectedPlan);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModules));
    }
  }, [selectedModules]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedPlanId) {
        window.sessionStorage.setItem(PLAN_STORAGE_KEY, selectedPlanId);
      } else {
        window.sessionStorage.removeItem(PLAN_STORAGE_KEY);
      }
    }
  }, [selectedPlanId]);

  useEffect(() => {
    if (loading) return;
    if (user || isDemoMode()) {
      void navigate({ to: "/dashboard" });
      return;
    }
    if (consumeDemoExpiredNotice()) {
      toast.error("Votre essai de démo a expiré. Ses données ont été effacées.", {
        description: "Relancez un essai gratuit ou créez votre compte pour continuer.",
      });
    }
  }, [loading, navigate, user]);

  function toggleModule(id: ModuleId) {
    setSelectedModules((current) =>
      current.includes(id) ? current.filter((moduleId) => moduleId !== id) : [...current, id],
    );
  }

  async function handleGoAuth(mode: "login" | "signup") {
    if (mode === "signup" && !canSignup) return;
    if (mode === "signup" && typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModules));
      if (selectedPlanId) window.sessionStorage.setItem(PLAN_STORAGE_KEY, selectedPlanId);
    }
    await navigate({ to: "/auth", search: { mode } });
  }

  async function handleStartDemo() {
    if (!canDemo) return;
    setActiveModules(selectedModules);
    try {
      await startDemo(selectedDemoModuleIds(selectedModules));
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de démarrer la démo.");
    }
  }

  const hasSelection = selectedModules.length > 0;
  const canDemo = hasSelection;
  const canSignup = hasSelection && selectedPlanId !== null;

  if (loading || user || isDemoMode()) return null;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-slate-900">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-3 py-4 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md lg:h-[min(820px,calc(100vh-2rem))] lg:grid-cols-[0.8fr_1.55fr]">
          <section className="flex flex-col justify-between gap-8 bg-slate-900/80 p-6 text-white sm:p-8 lg:min-h-0 lg:p-10">
            <div>
              <p className="text-sm font-medium text-blue-300">Bienvenue</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Gérez votre atelier comme un pro
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Tous vos outils au même endroit. Centralisez vos réparations, vos clients, vos
                ventes et l&apos;activité de votre équipe.
              </p>
            </div>

            <section aria-label="Actions d'authentification" className="space-y-3">
              <p className="text-sm font-semibold text-white">Démarrez dès maintenant</p>
              <Button
                type="button"
                disabled={!canSignup}
                className="min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleGoAuth("signup")}
              >
                Créer un compte · 7 jours gratuits
                <Check className="size-4" />
              </Button>
              <Button
                type="button"
                disabled={!canDemo}
                className="min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleStartDemo()}
              >
                <Gift className="size-4" />
                Essayer le mode démo · 1 jour
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void handleGoAuth("login")}
              >
                <Lock className="size-4" />
                Se connecter
              </Button>
              <p className="pt-1 text-center text-xs text-slate-400">
                La connexion est directe, sans choix de forfait ni paiement.
              </p>
              {!canDemo || !canSignup ? (
                <p className="text-center text-xs text-slate-300">
                  {!canDemo
                    ? "Sélectionnez au moins un domaine pour démarrer."
                    : "Sélectionnez une offre pour créer votre compte avec 7 jours gratuits."}
                </p>
              ) : null}
            </section>

            <p className="text-xs text-slate-400">© 2026 GogoSoft · Solution ivoirienne</p>
          </section>

          <section className="space-y-6 overflow-y-auto bg-white/95 p-5 sm:p-7 lg:min-h-0 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-orange-700">Configurez votre espace</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedModules.length
                    ? `${selectedModules.length} domaine${selectedModules.length > 1 ? "s" : ""} sélectionné${selectedModules.length > 1 ? "s" : ""}`
                    : "Choisissez vos activités et votre offre"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <img
                  src={profileLogo}
                  alt="GogoSoft"
                  className="size-11 rounded-full object-cover"
                />
                <span className="hidden text-lg font-bold text-slate-900 sm:inline">GogoSoft</span>
              </div>
            </div>

            <section aria-label="Choix des domaines" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-lg font-semibold">Vos domaines d&apos;activité</h2>
                {!canDemo ? (
                  <p className="text-xs text-slate-600">Sélectionnez au moins un domaine</p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {WELCOME_MODULES.map(({ id, title, description, icon: Icon, tone }) => {
                  const isSelected = selectedModules.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleModule(id)}
                      aria-pressed={isSelected}
                      className={`relative flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left shadow-3d-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                        isSelected
                          ? "border-orange-300 bg-green-800 text-white ring-2 ring-orange-500"
                          : "border-slate-200 bg-white text-slate-900 hover:border-orange-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                          tone === "orange"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 pr-4">
                        <span className={`block text-sm font-medium leading-tight ${isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                          {title}
                        </span>
                        <span className={`mt-1 block text-xs leading-tight ${isSelected ? "text-white/80" : "text-slate-600 dark:text-slate-400"}`}>
                          {description}
                        </span>
                      </span>
                      {isSelected ? (
                        <Check className="absolute right-2 top-2 size-4 text-orange-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-label="Offres mensuelles" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-lg font-semibold">Choisissez votre offre</h2>
                <p className="text-xs text-slate-600">Tarifs mensuels · Sans engagement</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {WELCOME_PRICING.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <label
                      key={plan.id}
                      className={`card-3d relative flex min-h-[176px] cursor-pointer flex-col rounded-xl border p-3 text-left transition-colors focus-within:ring-2 focus-within:ring-orange-500 ${
                        isSelected
                          ? "border-orange-300 bg-orange-50 ring-2 ring-orange-500"
                          : "border-slate-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="welcome-plan"
                        value={plan.id}
                        checked={isSelected}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="sr-only"
                      />
                      {plan.featured ? (
                        <span className="absolute right-3 top-3 rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-800">
                          Recommandé
                        </span>
                      ) : null}
                      {isSelected ? (
                        <Check className="absolute right-3 top-10 size-4 text-orange-600" />
                      ) : null}
                      <h3 className="text-sm font-bold text-slate-900">{plan.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-600">{plan.subtitle}</p>
                      <div className="mt-2 flex items-baseline gap-1 text-slate-900">
                        <span className="text-xl font-bold">
                          {plan.price.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-xs font-medium">FCFA/mois</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {plan.features.slice(0, 3).map((feature) => (
                          <li
                            key={`${plan.id}-${feature}`}
                            className="flex items-center gap-1.5 text-xs text-slate-700"
                          >
                            <Check className="size-3 shrink-0 text-green-700" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-500">
                L&apos;essai de 7 jours est gratuit ; aucun paiement n&apos;est demandé pour le
                démarrer.
              </p>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
