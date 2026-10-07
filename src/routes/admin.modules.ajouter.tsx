import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addModuleToTenant,
  getAllModules,
  getAllTenants,
  type AdminModule,
  type AdminTenant,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/modules/ajouter")({ component: AddModulePage });

function AddModulePage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [tenantShop, setTenantShop] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [type, setType] = useState<"free" | "paid">("free");
  const [duration, setDuration] = useState<"permanent" | "temporary">("permanent");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([getAllTenants(), getAllModules()])
      .then(([tenantRows, moduleRows]) => {
        setTenants(tenantRows);
        setModules(moduleRows);
      })
      .catch((reason: unknown) =>
        toast.error(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [shopId] = tenantShop.split("::");
    if (!shopId || !moduleCode || !motif.trim()) return;
    setSaving(true);
    try {
      await addModuleToTenant(shopId, moduleCode, type, duration, motif.trim());
      toast.success("Module ajouté et action consignée.");
      setMotif("");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'ajouter le module.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero
        title="Ajouter un module à un abonné"
        subtitle="Attribuez un module à un atelier et consignez le motif"
        icon={PackagePlus}
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={(event) => void submit(event)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tenant-shop">Abonné / atelier</Label>
              <select
                id="tenant-shop"
                required
                value={tenantShop}
                onChange={(event) => setTenantShop(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Sélectionner un atelier</option>
                {tenants.flatMap((tenant) =>
                  tenant.shopDetails.map((shop) => (
                    <option key={shop.id} value={`${shop.id}::${tenant.id}`}>
                      {tenant.name} · {shop.name}
                    </option>
                  )),
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-code">Module</Label>
              <select
                id="module-code"
                required
                value={moduleCode}
                onChange={(event) => setModuleCode(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Sélectionner un module</option>
                {modules.map((module) => (
                  <option key={module.code} value={module.code}>
                    {module.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="module-type">Type</Label>
                <select
                  id="module-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as "free" | "paid")}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="free">Gratuit</option>
                  <option value="paid">Payant</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-duration">Durée</Label>
                <select
                  id="module-duration"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value as "permanent" | "temporary")}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporaire</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-reason">Motif</Label>
              <Input
                id="module-reason"
                required
                value={motif}
                onChange={(event) => setMotif(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Ajouter le module"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
