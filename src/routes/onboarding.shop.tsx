import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { enableShopModules } from "@/services/moduleService";
import { createShop } from "@/services/shopService";
import { shopCodesFromModuleIds, type ModuleId } from "@/types/modules";
import logo from "@/assets/images/leprofile.png";

export const Route = createFileRoute("/onboarding/shop")({
  component: ShopOnboardingPage,
});

function ShopOnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createOnboardingShop() {
    if (!name.trim()) {
      toast.error("Le nom de la boutique est requis.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error("Utilisateur non authentifié.");

      const shop = await createShop({
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
      });

      let selectedModules: string[] = [];
      const rawModules = sessionStorage.getItem("gogosoft.checkout.selectedModules");
      if (rawModules) {
        try {
          const parsed: unknown = JSON.parse(rawModules);
          if (Array.isArray(parsed)) selectedModules = parsed.filter((item): item is string => typeof item === "string");
        } catch {
          selectedModules = [];
        }
      }
      await enableShopModules(shop.id, shopCodesFromModuleIds(selectedModules as ModuleId[]));

      const rawPlanPrice = sessionStorage.getItem("gogosoft.checkout.planPrice");
      const plan = sessionStorage.getItem("gogosoft.checkout.pricingMode") || "mensuel";
      const expiresAt = new Date(Date.now() + (7 + 30) * 24 * 60 * 60 * 1000).toISOString();
      const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan,
        status: "active",
        expires_at: expiresAt,
        selected_modules: selectedModules,
        price_fcfa: rawPlanPrice ? Number(rawPlanPrice) : null,
      }, { onConflict: "user_id" });
      if (subscriptionError) throw subscriptionError;

      const { error: rolesError } = await supabase
        .from("user_roles_by_shop" as never)
        .insert({ shop_id: shop.id, user_id: user.id, role: "owner" });
      if (rolesError) throw rolesError;

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("gogosoft.welcome.") || key.startsWith("gogosoft.checkout.") || key === "gogosoft.simulation.active") {
          sessionStorage.removeItem(key);
        }
      });
      toast.success("Boutique créée !");
      await navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("[onboarding/shop] Création impossible", error);
      toast.error(error instanceof Error ? error.message : "Impossible de créer la boutique.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(320px,42%)_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <img src={logo} alt="GogoSoft" className="size-20 rounded-full bg-white p-2 shadow-xl ring-4 ring-orange-500/30" />
        <div className="max-w-md">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">GogoSoft Tools Manager</p>
          <h1 className="font-display text-4xl font-bold leading-tight">Bienvenue dans votre nouvel espace.</h1>
          <p className="mt-5 text-lg text-slate-300">Configurez votre boutique et commencez à piloter votre activité.</p>
        </div>
        <p className="text-sm text-slate-400">Orange, blanc et vert pour une gestion simple et efficace.</p>
      </section>
      <section className="flex min-h-screen items-center bg-white px-5 py-10 dark:bg-slate-800 sm:px-10">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="mb-7 lg:hidden">
            <img src={logo} alt="GogoSoft" className="mx-auto size-16 rounded-full bg-white p-2 shadow-lg ring-4 ring-orange-500/30" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Créez votre boutique</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Renseignez les informations essentielles de votre établissement.</p>
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Nom de la boutique *</Label>
              <Input id="shop-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-address">Adresse (optionnel)</Label>
              <Input id="shop-address" value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-phone">Téléphone (optionnel)</Label>
              <Input id="shop-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <Button type="button" onClick={() => void createOnboardingShop()} disabled={!name.trim() || submitting} className="min-h-12 w-full bg-green-900 text-white hover:bg-green-800">
              {submitting ? "Création en cours..." : "Créer ma boutique"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
