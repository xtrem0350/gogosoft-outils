import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/services/clientService";

export const Route = createFileRoute("/clients/nouveau")({
  component: NewClientPage,
});

const formSchema = z.object({
  full_name: z.string().min(1, "Le nom est requis."),
  whatsapp: z.string().min(1, "Le numéro WhatsApp est requis."),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function NewClientPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      whatsapp: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  async function submit(values: FormValues) {
    try {
      const shopId = window.localStorage.getItem("gogosoft.currentShopId");
      if (!shopId) {
        toast.error("Sélectionnez d'abord une boutique.");
        return;
      }

      await createClient({
        shop_id: shopId,
        full_name: values.full_name,
        whatsapp: values.whatsapp,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      });

      toast.success("Client ajouté.");
      await navigate({ to: "/clients" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer le client.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Clients</p>
        <h1 className="mt-2 text-3xl font-bold">Nouveau client</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSubmit(submit)(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name ? <p className="text-sm text-destructive">{errors.full_name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" {...register("whatsapp")} />
              {errors.whatsapp ? <p className="text-sm text-destructive">{errors.whatsapp.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => void navigate({ to: "/clients" })}>
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
