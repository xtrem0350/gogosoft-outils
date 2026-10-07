import { createFileRoute } from "@tanstack/react-router";
import { DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPricingPlans, type PricingPlan } from "@/services/moduleService";
import { updatePricing } from "@/services/adminService";

export const Route = createFileRoute("/admin/prix")({ component: PricingPage });

function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    void getPricingPlans()
      .then(setPlans)
      .catch((reason: unknown) =>
        toast.error(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);
  function change(
    code: string,
    field: "monthly_price_fcfa" | "annual_price_fcfa" | "min_modules" | "max_modules",
    value: number,
  ) {
    setPlans((current) =>
      current.map((plan) => (plan.plan_code === code ? { ...plan, [field]: value } : plan)),
    );
  }
  async function save(plan: PricingPlan) {
    setSaving(plan.plan_code);
    try {
      await updatePricing(
        plan.plan_code,
        plan.monthly_price_fcfa,
        plan.annual_price_fcfa,
        plan.min_modules,
        plan.max_modules,
      );
      toast.success(`${plan.plan_label} enregistré.`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setSaving(null);
    }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title="Configuration des prix"
        subtitle="Tarifs mensuels et annuels des forfaits de la plateforme"
        icon={DollarSign}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.plan_code}>
            <CardHeader>
              <CardTitle>{plan.plan_label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-1 text-sm">
                Prix mensuel (FCFA)
                <Input
                  type="number"
                  min="0"
                  value={plan.monthly_price_fcfa}
                  onChange={(event) =>
                    change(plan.plan_code, "monthly_price_fcfa", Number(event.target.value))
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                Prix annuel (FCFA)
                <Input
                  type="number"
                  min="0"
                  value={plan.annual_price_fcfa}
                  onChange={(event) =>
                    change(plan.plan_code, "annual_price_fcfa", Number(event.target.value))
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm">
                  Modules min.
                  <Input
                    type="number"
                    min="1"
                    value={plan.min_modules}
                    onChange={(event) =>
                      change(plan.plan_code, "min_modules", Number(event.target.value))
                    }
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  Modules max.
                  <Input
                    type="number"
                    min={plan.min_modules}
                    value={plan.max_modules}
                    onChange={(event) =>
                      change(plan.plan_code, "max_modules", Number(event.target.value))
                    }
                  />
                </label>
              </div>
              <Button disabled={saving === plan.plan_code} onClick={() => void save(plan)}>
                {saving === plan.plan_code ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun forfait configuré.</p>
      ) : null}
    </div>
  );
}
