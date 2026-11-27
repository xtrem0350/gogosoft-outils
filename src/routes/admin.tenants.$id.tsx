import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage, withTimeout } from "@/lib/error-utils";
import { getTenantById, type AdminTenant } from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants/$id")({ component: TenantDetailsPage });

function TenantDetailsPage() {
  const { id } = Route.useParams();
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setTenant(null);
    setError(null);
    setLoading(true);
    void withTimeout(getTenantById(id), "Chargement du compte abonné")
      .then((result) => {
        if (!active) return;
        if (result) {
          setTenant(result);
        } else {
          setError("Aucun abonné ne correspond à cet identifiant.");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(getErrorMessage(reason, "Impossible de charger cet abonné."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title={tenant?.name ?? "Détail abonné"}
        subtitle={tenant?.email ?? "Informations du compte"}
        icon={UserRound}
        imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {tenant ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Statut : {tenant.status}</p>
              <p>Forfait : {tenant.plan ?? "Aucun"}</p>
              <p>
                Expiration :{" "}
                {tenant.expiresAt
                  ? new Date(tenant.expiresAt).toLocaleDateString("fr-FR")
                  : "Non définie"}
              </p>
              <p>Inscription : {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ateliers et domaines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tenant.shopDetails.map((shop) => (
                <p key={shop.id}>{shop.name}</p>
              ))}
              <p>{tenant.modules.join(", ") || "Aucun domaine enregistré sur l'abonnement."}</p>
            </CardContent>
          </Card>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}
    </div>
  );
}
