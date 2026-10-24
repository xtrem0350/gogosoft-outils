import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CheckoutModal, type CheckoutSubmission } from "@/components/CheckoutModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WELCOME_PRICING, type PricingPlan } from "@/constants/pricing";
import { isWelcomeDomainId, type WelcomeDomainId } from "@/constants/welcomeDomains";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/services/demoService";
import { completeSubscriptionCheckout } from "@/services/checkoutService";
import { createShop } from "@/services/shopService";
import { getMySubscription } from "@/services/subscriptionService";

const SELECTED_MODULES_KEY = "gogosoft.welcome.selectedModules";
const SELECTED_PLAN_KEY = "gogosoft.welcome.selectedPlan";

function readSelectedDomainIds(): WelcomeDomainId[] {
  const raw = window.sessionStorage.getItem(SELECTED_MODULES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isWelcomeDomainId) : [];
  } catch {
    return [];
  }
}

function readSelectedPlan(): PricingPlan | null {
  const selectedPlan = window.sessionStorage.getItem(SELECTED_PLAN_KEY);
  return WELCOME_PRICING.find((plan) => plan.id === selectedPlan) ?? null;
}

export const Route = createFileRoute("/boutiques/nouveau")({
  component: NewShopPage,
});

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function NewShopPage() {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading, refresh: refreshShops } = useCurrentShop();
  const demo = isDemoMode();
  const [domainIds] = useState(readSelectedDomainIds);
  const [plan] = useState(readSelectedPlan);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutShopId, setCheckoutShopId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [shopDetails, setShopDetails] = useState<FormValues>({
    name: "",
    address: "",
    phone: "",
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  useEffect(() => {
    if (shopLoading) return;
    if (demo) {
      void navigate({ to: "/dashboard" });
      return;
    }
    if (!shopId) return;

    let active = true;
    setCheckingSubscription(true);
    setCheckoutShopId(shopId);
    void getMySubscription()
      .then((subscription) => {
        if (active && subscription?.isActive) void navigate({ to: "/dashboard" });
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "Impossible de vérifier votre abonnement.",
        );
      })
      .finally(() => {
        if (active) setCheckingSubscription(false);
      });
    return () => {
      active = false;
    };
  }, [demo, navigate, shopId, shopLoading]);

  function startCheckout() {
    if (!plan || domainIds.length === 0) {
      toast.error("Choisissez vos domaines et une offre à l’accueil avant de continuer.");
      return;
    }
    setCheckoutOpen(true);
  }

  async function handleCheckoutPayment(submission: CheckoutSubmission) {
    if (!plan) throw new Error("Offre introuvable.");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("Utilisateur non authentifié.");

    setClientName(
      typeof user.user_metadata["full_name"] === "string"
        ? user.user_metadata["full_name"]
        : "",
    );
    setClientEmail(user.email ?? "");

    let selectedShopId = checkoutShopId ?? shopId;
    if (!selectedShopId) {
      const shop = await createShop({
        name:
          shopDetails.name.trim() || `Atelier ${user.email?.split("@")[0] ?? "GogoSoft"}`,
        address: shopDetails.address || null,
        phone: shopDetails.phone || null,
      });
      selectedShopId = shop.id;
      setCheckoutShopId(shop.id);
    }

    return completeSubscriptionCheckout({
      shopId: selectedShopId,
      planId: plan.id,
      planPrice: plan.price,
      domainIds,
      submission,
    });
  }

  async function finishCheckout() {
    const selectedShopId = checkoutShopId ?? shopId;
    if (!selectedShopId) throw new Error("Atelier introuvable après le paiement.");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("Utilisateur non authentifié.");

    window.localStorage.setItem("gogosoft.currentShopId", selectedShopId);
    await refreshShops(user.id, true);
    window.sessionStorage.removeItem(SELECTED_MODULES_KEY);
    window.sessionStorage.removeItem(SELECTED_PLAN_KEY);
    setCheckoutOpen(false);
    await navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Ateliers</p>
        <h1 className="mt-2 text-3xl font-bold">Finaliser votre abonnement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vos domaines et votre accès seront activés uniquement après confirmation du paiement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations atelier</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit((values) => {
                setShopDetails(values);
                startCheckout();
              })(event);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            {!plan || domainIds.length === 0 ? (
              <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Votre sélection d’offre ou de domaines est manquante. Revenez à l’accueil pour la
                compléter avant le paiement.
              </p>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                Offre sélectionnée : <strong>{plan.title}</strong> · {domainIds.length} domaine(s)
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || checkingSubscription || demo || !plan || domainIds.length === 0}
              className="w-full"
            >
              Continuer vers le paiement
            </Button>
          </form>
        </CardContent>
      </Card>

      {plan ? (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          plan={plan}
          selectedDomainIds={domainIds}
          domainRequired
          clientName={clientName}
          clientEmail={clientEmail}
          onPay={handleCheckoutPayment}
          onComplete={() => {
            void finishCheckout().catch((error: unknown) => {
              toast.error(
                error instanceof Error ? error.message : "Impossible de finaliser l’activation.",
              );
            });
          }}
        />
      ) : null}
    </div>
  );
}
