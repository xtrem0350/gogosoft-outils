import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientSelect } from "@/components/selects/ClientSelect";
import { DeviceSelect } from "@/components/selects/DeviceSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import type { ClientRecord } from "@/services/clientService";
import {
  generateDiagnosis,
  ISSUES_DATABASE,
  createTicket,
  type IssueKey,
  type WorkshopDiagnosis,
} from "@/services/workshopService";

export const Route = createFileRoute("/atelier/nouveau")({ component: NewWorkshopTicketPage });

const issueKeys = Object.keys(ISSUES_DATABASE) as IssueKey[];
const formSchema = z.object({
  client_name: z.string().min(1, "Le nom est requis."),
  client_whatsapp: z.string().min(1, "Le WhatsApp est requis."),
  client_id: z.string().nullable(),
  device_model: z.string().min(1, "Le modèle est requis."),
  device_processor: z.string(),
  device_imei: z.string(),
  device_sn: z.string(),
  device_os_version: z.string(),
  notes: z.string(),
  entry_fee: z.number().min(0),
  entry_fee_paid: z.boolean(),
  diagnostic_notes: z.string(),
  issues: z.array(z.string()).min(1, "Sélectionnez au moins une panne."),
});
type WorkshopFormValues = z.infer<typeof formSchema>;

/** Formulaire de création d'une fiche de réparation. */
function NewWorkshopTicketPage() {
  const navigate = useNavigate();
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [diagnosis, setDiagnosis] = useState<WorkshopDiagnosis | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkshopFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: "",
      client_whatsapp: "",
      client_id: null,
      device_model: "",
      device_processor: "",
      device_imei: "",
      device_sn: "",
      device_os_version: "",
      notes: "",
      entry_fee: 2000,
      entry_fee_paid: false,
      diagnostic_notes: "",
      issues: [],
    },
  });

  function showDiagnosis(values: WorkshopFormValues) {
    setDiagnosis(generateDiagnosis(values.issues as IssueKey[]));
  }

  function selectClient(client: ClientRecord) {
    setValue("client_id", client.id, { shouldValidate: true });
    setValue("client_name", client.full_name, { shouldValidate: true });
    setValue("client_whatsapp", client.whatsapp, { shouldValidate: true });
  }

  async function submit(values: WorkshopFormValues) {
    if (shopLoading || !shopId) {
      toast.error("Sélectionnez une boutique avant de créer une fiche.");
      return;
    }
    try {
      const selectedIssues = values.issues as IssueKey[];
      await createTicket({
        shop_id: shopId,
        ...values,
        issues: selectedIssues,
        diagnosis: diagnosis ?? generateDiagnosis(selectedIssues),
      });
      toast.success("Fiche d'atelier enregistrée.");
      await navigate({ to: "/atelier" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la fiche.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Atelier</p>
        <h1 className="mt-2 text-3xl font-bold">Nouvelle fiche</h1>
        <p className="mt-2 text-muted-foreground">
          Enregistrez l'appareil et préparez son parcours de réparation.
        </p>
      </div>
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Client *</Label>
            <ClientSelect
              shopId={shopId}
              value={clientId ?? undefined}
              onSelect={selectClient}
              onCreateNew={() => void navigate({ to: "/clients/nouveau" })}
            />
            {clientWhatsapp ? (
              <p className="text-sm text-muted-foreground">WhatsApp : {clientWhatsapp}</p>
            ) : null}
            {errors.client_name && (
              <p className="text-sm text-destructive">{errors.client_name.message}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appareil</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Appareil déjà connu</Label>
              <DeviceSelect
                shopId={shopId}
                onSelect={(device) => {
                  setValue("device_model", device.device_model, { shouldValidate: true });
                  setValue("device_processor", device.device_processor ?? "");
                  setValue("device_imei", device.device_imei ?? "");
                  setValue("device_sn", device.device_sn ?? "");
                  setValue("device_os_version", device.device_os_version ?? "");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_model">Modèle *</Label>
              <Input id="device_model" {...register("device_model")} />
              {errors.device_model && (
                <p className="text-sm text-destructive">{errors.device_model.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_processor">Processeur</Label>
              <Input id="device_processor" {...register("device_processor")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_imei">IMEI</Label>
              <Input id="device_imei" {...register("device_imei")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_sn">SN</Label>
              <Input id="device_sn" {...register("device_sn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device_os_version">Version OS</Label>
              <Input id="device_os_version" {...register("device_os_version")} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Frais de diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry_fee">Frais de diagnostic (FCFA)</Label>
                <Input id="entry_fee" type="number" min="0" {...register("entry_fee", { valueAsNumber: true })} />
              </div>
              <Controller
                name="entry_fee_paid"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3 pt-7">
                    <Switch id="entry_fee_paid" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="entry_fee_paid">Frais payés</Label>
                  </div>
                )}
              />
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Ces frais couvrent le diagnostic. Ils ne sont pas remboursables.
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnostic_notes">Notes de diagnostic</Label>
              <Textarea id="diagnostic_notes" {...register("diagnostic_notes")} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pannes constatées</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {issueKeys.map((issue) => (
              <Controller
                key={issue}
                name="issues"
                control={control}
                render={({ field }) => {
                  const checked = field.value.includes(issue);
                  return (
                    <Label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          field.onChange(
                            value
                              ? [...field.value, issue]
                              : field.value.filter((item) => item !== issue),
                          )
                        }
                      />
                      {ISSUES_DATABASE[issue].label}
                    </Label>
                  );
                }}
              />
            ))}
            {errors.issues && (
              <p className="text-sm text-destructive sm:col-span-2">{errors.issues.message}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea {...register("notes")} placeholder="Observations à l'arrivée..." />
          </CardContent>
        </Card>
        {diagnosis && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic généré</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <Badge variant="secondary">Outils nécessaires</Badge>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {diagnosis.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge variant="secondary">Processus</Badge>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                  {diagnosis.process.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleSubmit(showDiagnosis)}>
            Générer le diagnostic
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Enregistrer la fiche
          </Button>
        </div>
      </form>
    </div>
  );
}
