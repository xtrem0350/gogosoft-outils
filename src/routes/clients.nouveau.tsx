import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { createClient } from "@/services/clientService";

export const Route = createFileRoute("/clients/nouveau")({
  component: NewClientPage,
  shouldReload: false,
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
  const { shopId } = useCurrentShop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { values, setField, clear } = usePersistedFormState<FormValues>("clients-nouveau", {
    full_name: "",
    whatsapp: "",
    email: "",
    address: "",
    notes: "",
  });

  async function submit(values: FormValues) {
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        nextErrors[key] ??= issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      if (!shopId) {
        toast.error("⚠️ Sélectionnez d'abord une boutique.");
        return;
      }

      const client = await createClient({
        shop_id: shopId,
        full_name: values.full_name,
        whatsapp: values.whatsapp,
        email: values.email || null,
        address: values.address || null,
        notes: values.notes || null,
      });

      toast.success(`Client créé : ${client.full_name}`);
      clear();
      await navigate({ to: "/clients" });
    } catch (error) {
      toast.error(
        `❌ ${error instanceof Error ? error.message : "Impossible de créer le client."}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Clients</p>
        <h1 className="mt-2 text-3xl font-bold">👥 Nouveau client</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => {
            event.preventDefault();
            void submit(values);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input id="full_name" value={values.full_name} onChange={(event) => setField("full_name", event.target.value)} />
              {errors.full_name ? (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" value={values.whatsapp} onChange={(event) => setField("whatsapp", event.target.value)} />
              {errors.whatsapp ? (
                <p className="text-sm text-destructive">{errors.whatsapp}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={values.email} onChange={(event) => setField("email", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={values.address} onChange={(event) => setField("address", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={values.notes} onChange={(event) => setField("notes", event.target.value)} />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate({ to: "/clients" })}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                💾 Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
