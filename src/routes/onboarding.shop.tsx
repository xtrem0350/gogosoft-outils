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

      const ownerRoles = ["owner", "technicien", "caissier", "magasinier", "receptionniste", "vendeur"];
      const { error: rolesError } = await supabase
        .from("user_roles_by_shop" as never)
        .insert(ownerRoles.map((role) => ({ shop_id: shop.id, user_id: user.id, role })));
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
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <h1 className="text-3xl font-bold">Créez votre boutique</h1>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Nom *</Label>
            <Input id="shop-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-address">Adresse</Label>
            <Input id="shop-address" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone">Téléphone</Label>
            <Input id="shop-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <Button type="button" onClick={() => void createOnboardingShop()} disabled={!name.trim() || submitting} className="min-h-12 w-full bg-green-800 text-white hover:bg-green-700">
            {submitting ? "Création en cours..." : "Créer ma boutique"}
          </Button>
        </div>
      </section>
    </main>
  );
}
