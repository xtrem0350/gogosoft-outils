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
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-green-50 text-slate-900">
      <header className="h-16 border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <img src={profileLogo} alt="" className="size-10 rounded-full object-cover" />
            <span className="truncate text-lg font-bold">GogoSoft</span>
          </div>
          <span className="hidden text-sm font-medium text-slate-600 md:block">
            🇨🇮 Solution ivoirienne
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-slate-700"
              onClick={() => void handleGoAuth("login")}
            >
              Se connecter
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canSignup}
              onClick={() => void handleGoAuth("signup")}
            >
              Créer un compte
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-3 px-4 pb-3">
        <section className="py-3 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Gérez votre atelier comme un pro
          </h1>
          <p className="mt-1 text-sm text-slate-700 md:text-base">
            Une seule app pour tout gérer
          </p>
        </section>

        <section aria-label="Choix des modules" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold">Choisissez vos domaines d&apos;activité</h2>
            {!canDemo ? (
              <p className="text-xs text-slate-600">Sélectionnez au moins un module</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {WELCOME_MODULES.map(({ id, title, icon: Icon, tone }) => {
              const isSelected = selectedModules.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleModule(id)}
                  aria-pressed={isSelected}
                  className={`card-3d relative flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    isSelected
                      ? "border-orange-300 bg-orange-50 ring-2 ring-orange-500"
                      : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      tone === "orange" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="pr-5 text-sm font-medium leading-tight text-slate-800">
                    {title}
                  </span>
                  {isSelected ? (
                    <Check className="absolute right-2 top-2 size-4 text-orange-600" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Offre mensuelle" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold">Choisissez votre offre</h2>
            <p className="text-xs text-slate-600">Tarifs mensuels · Sans engagement</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {WELCOME_PRICING.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <label
                  key={plan.id}
                  className={`card-3d relative flex h-[180px] cursor-pointer flex-col rounded-xl border p-3 text-left transition-colors focus-within:ring-2 focus-within:ring-orange-500 ${
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
                    <span className="text-xl font-bold">{plan.price.toLocaleString("fr-FR")}</span>
                    <span className="text-xs font-medium">FCFA/mois</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={`${plan.id}-${feature}`} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Check className="size-3 shrink-0 text-green-700" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </label>
              );
            })}
          </div>
        </section>

        <section aria-label="Actions principales" className="space-y-2 pt-1">
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              type="button"
              disabled={!canDemo}
              className="min-h-10 flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleStartDemo()}
            >
              <Gift className="size-4" />
              Essai démo · 1 jour
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canSignup}
              className="min-h-10 flex-1 border-slate-300 text-slate-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleGoAuth("signup")}
            >
              Créer un compte · 7 jours gratuits
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 flex-1 text-slate-700 hover:bg-slate-100"
              onClick={() => void handleGoAuth("login")}
            >
              <Lock className="size-4" />
              Se connecter
            </Button>
          </div>
          {!canDemo || (canDemo && !canSignup) ? (
            <p className="text-center text-xs text-slate-600">
              {!canDemo
                ? "Sélectionnez au moins un module pour lancer la démo."
                : "Sélectionnez une offre pour créer votre compte avec 7 jours gratuits."}
            </p>
          ) : null}
        </section>

        <footer className="pb-1 text-center text-xs text-slate-500">
          © 2026 GogoSoft
        </footer>
      </div>
    </main>
  );
}
