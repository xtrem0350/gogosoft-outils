import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteSubscriber,
  getAllTenants,
  isProtectedSubscriberId,
  revokeTenant,
  type AdminTenant,
} from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants")({ component: AdminTenantsPage });

function AdminTenantsPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.is_super_admin === true;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({
    select: (state) => state.location.search as { status?: string },
  });
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTenant | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDeleteSubscriber() {
    if (!deleteTarget || !isSuperAdmin) return;
    setDeleting(true);
    try {
      await deleteSubscriber(deleteTarget.id);
      setTenants((current) => current.filter((tenant) => tenant.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Compte et données associés supprimés.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Tous les abonnés"
        subtitle="Comptes, ateliers, forfaits et domaines de la plateforme"
        icon={Users}
        imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
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
                  "Domaines",
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
                        Domaines
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void revoke(tenant)}>
                        Révoquer
                      </Button>
                      {isSuperAdmin &&
                      !tenant.isSuperAdmin &&
                      !isProtectedSubscriberId(tenant.id) ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(tenant)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
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
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!deleting && !open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce souscripteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le compte, ses boutiques, ses abonnements et
              ses factures. Irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-sm font-medium">{deleteTarget?.name}</p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteSubscriber();
              }}
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
