import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyShopModulesChanged } from "@/hooks/useShopModules";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { enableShopModules } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { addShopMember, createShop } from "@/services/shopService";
import { updateTrialModules } from "@/services/subscriptionService";
import { MODULE_IDS, shopCodesFromModuleIds, type ModuleId } from "@/types/modules";

const SELECTED_MODULES_KEY = "gogosoft.welcome.selectedModules";
const SELECTED_PLAN_KEY = "gogosoft.welcome.selectedPlan";

function readSelectedModules(): ModuleId[] {
  const raw = window.sessionStorage.getItem(SELECTED_MODULES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is ModuleId =>
      MODULE_IDS.includes(value as ModuleId),
    );
  } catch {
    return [];
  }
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  useEffect(() => {
    if (!shopLoading && shopId) void navigate({ to: "/dashboard" });
  }, [navigate, shopId, shopLoading]);

  async function submit(values: FormValues) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Utilisateur non authentifié.");

      const selectedModules = readSelectedModules();
      const moduleCodes = shopCodesFromModuleIds(selectedModules);
      const shop = await createShop({
        name: values.name,
        address: values.address || null,
        phone: values.phone || null,
      });

      await addShopMember(shop.id, userId, "owner");
      await enableShopModules(shop.id, moduleCodes);
      notifyShopModulesChanged(shop.id);
      await updateTrialModules(userId, moduleCodes);

      window.localStorage.setItem("gogosoft.currentShopId", shop.id);
      await refreshShops(userId, true);
      window.sessionStorage.removeItem(SELECTED_MODULES_KEY);
      window.sessionStorage.removeItem(SELECTED_PLAN_KEY);

      toast.success("Boutique créée ! Bienvenue sur GogoSoft.");
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer l'atelier.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Ateliers</p>
        <h1 className="mt-2 text-3xl font-bold">Créer un nouvel atelier</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations atelier</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSubmit(submit)(event)} className="space-y-4">
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

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate({ to: "/boutiques" })}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
