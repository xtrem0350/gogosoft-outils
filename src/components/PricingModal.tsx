import { useEffect, useState } from "react";
import { Check, Globe2 } from "lucide-react";

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
import { useAuth } from "@/hooks/useAuth";
import { getFirstTrialUsedAt } from "@/services/deviceService";

type Plan = "free" | "mensuel" | "annuel";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: () => void;
  isBlocking?: boolean;
}

const plans: { id: Plan; name: string; price: string; period: string; detail: string }[] = [
  { id: "free", name: "Free", price: "0 FCFA", period: "/ 7 jours", detail: "Pour découvrir" },
  {
    id: "mensuel",
    name: "Mensuel",
    price: "5 000 FCFA",
    period: "/ mois",
    detail: "Facturé chaque mois",
  },
  {
    id: "annuel",
    name: "Annuel",
    price: "50 000 FCFA",
    period: "/ an",
    detail: "Économisez 10 000 FCFA",
  },
];

export function PricingModal({
  open,
  onOpenChange,
  onCreateAccount,
  isBlocking = false,
}: PricingModalProps) {
  const { user } = useAuth();
  const [firstTrialUsedAt, setFirstTrialUsedAt] = useState<string | null>(null);
  const [trialStatusLoaded, setTrialStatusLoaded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free");
  const [domainIncluded, setDomainIncluded] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [domainMessage, setDomainMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setTrialStatusLoaded(false);
    if (!user) {
      setFirstTrialUsedAt(null);
      setSelectedPlan("free");
      setDomainIncluded(false);
      setTrialStatusLoaded(true);
      return;
    }
    void getFirstTrialUsedAt(user.id)
      .then((value) => {
        if (active) {
          setFirstTrialUsedAt(value);
          setSelectedPlan(value ? "mensuel" : "free");
          setDomainIncluded(false);
        }
      })
      .catch(() => {
        if (active) setFirstTrialUsedAt(null);
      })
      .finally(() => {
        if (active) setTrialStatusLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [open, user]);

  const availablePlans = firstTrialUsedAt ? plans.filter((plan) => plan.id !== "free") : plans;

  function choosePlan(plan: Plan) {
    setSelectedPlan(plan);
    setDomainIncluded(plan === "annuel");
    setDomainMessage("");
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

  return (
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent
        className={`max-h-[90dvh] max-w-5xl overflow-y-auto ${isBlocking ? "[&>button]:hidden" : ""}`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Choisissez votre forfait</DialogTitle>
          <DialogDescription>
            {isBlocking
              ? "Votre abonnement a expiré. Choisissez un forfait pour continuer."
              : "Un forfait adapté à votre atelier, sans engagement caché."}
          </DialogDescription>
        </DialogHeader>

        {firstTrialUsedAt ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Votre essai gratuit a déjà été utilisé.
          </p>
        ) : null}

        {!trialStatusLoaded ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement des forfaits…</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {availablePlans.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choosePlan(plan.id)}
                    className={`relative flex min-h-40 flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                      selected
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/60"
                        : "border-border bg-background hover:border-amber-300"
                    }`}
                  >
                    {selected ? (
                      <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-amber-500 text-white">
                        <Check className="size-3.5" />
                      </span>
                    ) : null}
                    <span className="font-semibold">{plan.name}</span>
                    <span className="mt-4 text-xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                    <span className="mt-3 text-xs text-muted-foreground">{plan.detail}</span>
                    {plan.id === "annuel" ? (
                      <span className="mt-2 rounded-sm bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-900">
                        ÉCONOMISEZ 10 000 FCFA · .COM OFFERT
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {selectedPlan === "mensuel" || selectedPlan === "annuel" ? (
              <section className="space-y-3 rounded-md border p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="domain-included"
                    checked={domainIncluded}
                    disabled={selectedPlan === "annuel"}
                    onCheckedChange={(checked) => setDomainIncluded(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="domain-included" className="leading-5">
                    {selectedPlan === "annuel"
                      ? "Inclus : nom de domaine .com offert"
                      : "Ajouter un nom de domaine .com (+ 10 000 FCFA/an)"}
                  </Label>
                </div>
                {domainIncluded ? (
                  <div className="space-y-2">
                    <Label htmlFor="domain-name">Nom de domaine</Label>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
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
              </section>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              {!isBlocking ? (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
              ) : null}
              <Button type="button" onClick={onCreateAccount}>
                {selectedPlan === "free" ? "Créer mon compte" : "Continuer"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
