import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addShopMember, createShop } from "@/services/shopService";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  async function submit(values: FormValues) {
    try {
      const shop = await createShop({
        name: values.name,
        address: values.address || null,
        phone: values.phone || null,
      });

      const { data: userData } = await (
        await import("@/integrations/supabase/client")
      ).supabase.auth.getUser();
      if (userData.user?.id) {
        await addShopMember(shop.id, userData.user.id, "owner");
      }

      toast.success("Atelier créé.");
      await navigate({ to: "/boutiques" });
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
