import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantById, type AdminTenant } from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants/$id")({ component: TenantDetailsPage });

function TenantDetailsPage() {
  const { id } = Route.useParams();
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getTenantById(id).then(setTenant).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")); }, [id]);
  return <div className="mx-auto max-w-5xl space-y-6"><PageHero title={tenant?.name ?? "Détail abonné"} subtitle={tenant?.email ?? "Informations du compte"} icon={UserRound} />{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}{tenant ? <div className="grid gap-5 md:grid-cols-2"><Card><CardHeader><CardTitle>Abonnement</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Statut : {tenant.status}</p><p>Forfait : {tenant.plan ?? "Aucun"}</p><p>Expiration : {tenant.expiresAt ? new Date(tenant.expiresAt).toLocaleDateString("fr-FR") : "Non définie"}</p><p>Inscription : {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}</p></CardContent></Card><Card><CardHeader><CardTitle>Ateliers et modules</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{tenant.shopDetails.map((shop) => <p key={shop.id}>{shop.name}</p>)}<p>{tenant.modules.join(", ") || "Aucun module enregistré sur l'abonnement."}</p></CardContent></Card></div> : <p className="text-sm text-muted-foreground">Chargement…</p>}</div>;
}