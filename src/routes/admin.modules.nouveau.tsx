import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createModule } from "@/services/adminService";

export const Route = createFileRoute("/admin/modules/nouveau")({ component: NewModulePage });

function NewModulePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await createModule({
        code: String(form.get("code")).trim(),
        label: String(form.get("label")).trim(),
        description: String(form.get("description")).trim(),
      });
      toast.success("Module créé.");
      await navigate({ to: "/admin/modules" as any });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero
        title="Créer un nouveau module"
        subtitle="Ajoutez une fonctionnalité au catalogue de la plateforme"
        icon={PackagePlus}
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module-label">Nom</Label>
              <Input id="module-label" name="label" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-code-create">Code unique</Label>
              <Input id="module-code-create" name="code" required pattern="[a-z0-9_-]+" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Description</Label>
              <Input id="module-description" name="description" />
            </div>
            <Button disabled={saving}>{saving ? "Création…" : "Créer le module"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
