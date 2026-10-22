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
          "Choisissez vos modules (réparation, vente, vitrine), démarrez une démo d'un jour ou un essai gratuit de sept jours.",
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="card-3d w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 !bg-white/10 shadow-2xl shadow-3d backdrop-blur-md">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="flex min-h-[280px] flex-col justify-center bg-slate-900/70 p-8 text-white lg:min-h-[640px] lg:p-10">
              <div className="flex flex-col items-center justify-center gap-5 text-center">
                <div className="size-32 overflow-hidden rounded-full border-2 border-slate-300 dark:border-slate-600">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={profileLogo}
                    alt="GogoSoft logo"
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Atelier numérique</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
                    Tous vos outils, au même endroit. Centralisez vos réparations, vos clients, vos
                    diagnostics et l’activité de votre équipe.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-950/60 p-7 sm:p-8 lg:p-10">
              <div className="mx-auto max-w-xl">
                <div className="mb-6">
                  <p className="text-sm font-medium text-blue-300">Bienvenue</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">GogoSoft Tools Manager</h1>
                  <p className="mt-2 text-sm text-slate-300">Connectez-vous pour gérer votre atelier.</p>
                </div>

                <div className="max-h-[min(72vh,48rem)] overflow-y-auto pr-1">
                  <section aria-label="Choix des modules" className="space-y-3">
                    <div className="mb-3">
                      <h2 className="text-lg font-bold text-white">1. Choisissez vos modules</h2>
                      <p className="text-sm text-slate-300">Sélectionnez au moins un module pour continuer</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {WELCOME_MODULES.map(({ id, title, description, icon: Icon, tone }) => {
                        const isSelected = selectedModules.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleModule(id)}
                            aria-pressed={isSelected}
                            className={`card-3d relative flex min-h-[120px] w-full flex-col justify-between rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-3d-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                              isSelected
                                ? "scale-[1.01] ring-2 ring-orange-500"
                                : "border-slate-200"
                            }`}
                          >
                            {isSelected ? (
                              <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                                <Check className="size-3.5" />
                              </span>
                            ) : null}
                            <div
                              className={`mb-4 flex size-11 items-center justify-center rounded-xl ${
                                tone === "orange" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                              }`}
                            >
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{title}</p>
                              <p className="mt-1 text-sm text-slate-500">{description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section aria-label="Offre mensuelle" className="mt-7 space-y-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">2. Votre offre mensuelle</h2>
                      <p className="text-sm text-slate-300">Tarifs revus à la baisse · Sans engagement</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {WELCOME_PRICING.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        return (
                        <label
                          key={plan.id}
                          className={`card-3d relative block cursor-pointer rounded-xl p-4 text-left transition-all focus-within:ring-2 focus-within:ring-orange-500 ${
                            isSelected
                              ? "scale-[1.02] bg-orange-50 ring-2 ring-orange-500"
                              : plan.featured
                                ? "ring-1 ring-slate-300 hover:shadow-3d-hover"
                                : "hover:shadow-3d-hover"
                          }`}
                        >
                          <input
                            type="radio"
                            name="welcome-plan"
                            value={plan.id}
                            checked={isSelected}
                            onChange={() => setSelectedPlanId(plan.id)}
                            className="peer sr-only"
                          />
                          {isSelected ? (
                            <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                              <Check className="size-4" />
                            </span>
                          ) : null}
                            {plan.featured ? (
                              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
                                Recommandé
                              </div>
                            ) : null}
                            <h3 className="text-xl font-bold text-slate-900">{plan.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{plan.subtitle}</p>
                            <div className="mt-5 flex items-end gap-1 text-slate-900">
                              <span className="text-3xl font-bold">{plan.price.toLocaleString("fr-FR")}</span>
                              <span className="pb-1 text-xs font-medium uppercase text-slate-500">FCFA</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">/mois</p>
                            <ul className="mt-5 space-y-2">
                              {plan.features.map((feature) => (
                                <li key={`${plan.id}-${feature}`} className="flex items-center gap-2 text-sm text-slate-600">
                                  <span className="flex size-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <Check className="size-3" />
                                  </span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                        </label>
                        );
                      })}
                    </div>

                    <p className="text-center text-xs text-slate-400">
                      🌐 Domaine .com : 10 000 FCFA/an · SSL gratuit · 📱 Wave, OM, MTN, Moov
                    </p>
                  </section>

                  <section aria-label="Actions principales" className="mt-7 space-y-3">
                    {!canDemo ? (
                      <p className="text-sm font-medium text-amber-300">
                        ⚠️ Sélectionnez au moins un module pour lancer la démo.
                      </p>
                    ) : null}
                    {canDemo && !canSignup ? (
                      <p className="text-sm font-medium text-amber-300">
                        💡 Pour l&apos;essai gratuit 7 jours avec compte, sélectionnez aussi une offre.
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        size="lg"
                        disabled={!canDemo}
                        className="flex-1 bg-ivoirien bg-ivoirien-hover shadow-3d disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void handleStartDemo()}
                      >
                        <Gift className="size-4" />
                        Essai démo · 1 jour
                      </Button>

                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        disabled={!canSignup}
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void handleGoAuth("signup")}
                      >
                        Créer un compte · 7 jours gratuits
                      </Button>

                      <Button
                        type="button"
                        size="lg"
                        variant="ghost"
                        className="flex-1 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => void handleGoAuth("login")}
                      >
                        <Lock className="size-4" />
                        Se connecter
                      </Button>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                      Démo locale sans compte · Essai de sept jours après création du compte
                    </p>
                  </section>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
