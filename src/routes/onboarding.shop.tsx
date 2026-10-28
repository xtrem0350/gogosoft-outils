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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 via-white to-green-50 p-4">
      <div className="card-3d shadow-3d grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white lg:grid-cols-2">
        <aside className="flex min-h-[280px] flex-col justify-between bg-slate-900 p-8 text-white lg:min-h-[620px]">
          <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <img src={logo} alt="GogoSoft" className="size-20 rounded-full bg-white object-cover" />
            <h1 className="text-2xl font-bold">GogoSoft</h1>
            <p className="text-sm text-slate-300">Gérez votre atelier comme un pro.</p>
          </div>
          <div className="mt-10 space-y-4 text-center lg:text-left">
            <p className="text-sm font-semibold">Démarrez dès maintenant</p>
            <p className="text-xs text-slate-400">© 2026 GogoSoft · Solution ivoirienne</p>
          </div>
        </aside>

        <section className="bg-white p-8 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => void navigate({ to: "/dashboard" })}
            className="mb-6 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600 dark:text-slate-300"
          >
            ← Retour
          </button>
          <header>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Créez votre atelier</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Quelques infos pour démarrer</p>
          </header>
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void createOnboardingShop();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="shop-name">Nom de l&apos;atelier *</Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-address">Adresse (optionnel)</Label>
              <Input
                id="shop-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-phone">Téléphone (optionnel)</Label>
              <Input
                id="shop-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="focus-visible:ring-orange-500"
              />
            </div>
            <Button type="submit" disabled={!name.trim() || submitting} className="min-h-12 w-full bg-green-900 text-white hover:bg-green-800">
              {submitting ? "Création en cours..." : "Créer mon atelier"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
