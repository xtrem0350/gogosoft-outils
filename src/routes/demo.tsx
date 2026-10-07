import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Gamepad2,
  Laptop,
  Package,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { getDemoModuleCodes, selectedDemoModuleIds, startDemo } from "@/services/demoService";
import { MODULES, MODULE_IDS, moduleIdsFromShopCodes, type ModuleId } from "@/types/modules";

export const Route = createFileRoute("/demo")({ component: DemoPage });

const moduleIcons: Record<ModuleId, LucideIcon> = {
  "reparation-telephone": Smartphone,
  "reparation-pc": Laptop,
  "vente-telephone": ShoppingCart,
  "vente-pc": ShoppingCart,
  consommables: Package,
  "vitrine-telephone": Smartphone,
  "vitrine-pc": Laptop,
  "multi-ateliers": Store,
};

function DemoPage() {
  const navigate = useNavigate();
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(() =>
    moduleIdsFromShopCodes(getDemoModuleCodes()),
  );
  const [starting, setStarting] = useState(false);

  function toggleModule(code: ModuleId) {
    setSelectedModules((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleStartDemo() {
    setStarting(true);
    try {
      await startDemo(selectedDemoModuleIds(selectedModules));
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de démarrer la démo.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <PageHero
          title="🎮 Testez GogoSoft en 30 secondes"
          subtitle="Choisissez vos modules, on prépare votre démo avec des données d'exemple."
          icon={Gamepad2}
          iconColor="orange"
        />

        <section aria-label="Modules de démonstration">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULE_IDS.map((code) => {
              const { label, description } = MODULES[code];
              const Icon = moduleIcons[code];
              const selected = selectedModules.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleModule(code)}
                  className={`flex min-h-24 items-center gap-4 rounded-lg border bg-white px-4 py-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    selected
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-green-500 hover:bg-green-50/60"
                  }`}
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-lg ${
                      selected ? "bg-orange-500 text-white" : "bg-green-100 text-green-800"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{label}</span>
                    <span className="mt-1 block text-sm text-slate-500">{description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid size-5 shrink-0 place-items-center rounded border ${
                      selected
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col items-center gap-4">
            <Button
              type="button"
              disabled={selectedModules.length === 0 || starting}
              onClick={() => void handleStartDemo()}
              className="h-12 w-full max-w-sm bg-ivoirien px-6 font-semibold text-white shadow-3d hover:bg-ivoirien-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Gamepad2 className="size-5" />
              {starting ? "Préparation de la démo..." : "🎮 Tester cette configuration"}
            </Button>
            <Link
              to="/auth"
              className="text-sm font-medium text-green-800 underline-offset-4 hover:underline"
            >
              Ou créez un compte
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}