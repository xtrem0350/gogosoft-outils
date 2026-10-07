import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllTenants, revokeTenant, type AdminTenant } from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants")({ component: AdminTenantsPage });

function AdminTenantsPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({
    select: (state) => state.location.search as { status?: string },
  });
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const status =
      search.status === "active" || search.status === "late" ? search.status : undefined;
    void getAllTenants(status ? { status } : {})
      .then(setTenants)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, [search.status]);

  if (pathname !== "/admin/tenants" && pathname !== "/admin/tenants/") return <Outlet />;

  async function revoke(tenant: AdminTenant) {
    const shop = tenant.shopDetails[0];
    if (!shop || !window.confirm(`Révoquer l'abonnement de ${tenant.name} ?`)) return;
    const reason = window.prompt("Motif de révocation");
    if (!reason?.trim()) return;
    try {
      await revokeTenant(shop.id, reason.trim(), "expire");
      toast.success("Abonnement révoqué.");
      const status =
        search.status === "active" || search.status === "late" ? search.status : undefined;
      setTenants(await getAllTenants(status ? { status } : {}));
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Révocation impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Tous les abonnés"
        subtitle="Comptes, ateliers, forfaits et modules de la plateforme"
        icon={Users}
      />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Nom",
                  "Email",
                  "Atelier(s)",
                  "Forfait",
                  "Modules",
                  "Expiration",
                  "Statut",
                  "Actions",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3">{tenant.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {tenant.shopDetails.map((shop) => shop.name).join(", ") || "Aucun"}
                  </td>
                  <td className="px-4 py-3">{tenant.plan ?? "—"}</td>
                  <td className="px-4 py-3">{tenant.modules.length}</td>
                  <td className="px-4 py-3">
                    {tenant.expiresAt
                      ? new Date(tenant.expiresAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">{tenant.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void navigate({ to: `/admin/tenants/${tenant.id}` as any })}
                      >
                        Voir détail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void navigate({ to: "/admin/modules/ajouter" as any })}
                      >
                        Modules
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void revoke(tenant)}>
                        Révoquer
                      </Button>
                      <a
                        className="inline-flex h-8 items-center rounded-md px-2 text-xs hover:bg-muted"
                        href={`mailto:${tenant.email ?? ""}`}
                      >
                        Contacter
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun abonné pour ce filtre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
