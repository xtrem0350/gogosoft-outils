import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { getErrorMessage, withTimeout } from "@/lib/error-utils";
import { getAllTenants, getTenantHistory } from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants/historique")({ component: TenantHistoryPage });

function TenantHistoryPage() {
  const [entries, setEntries] = useState<
    Array<{ id: string; action: string; metadata: unknown; created_at: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void withTimeout(
      getAllTenants().then(async (tenants) => {
        const rows = await Promise.all(tenants.map((tenant) => getTenantHistory(tenant.id)));
        return rows.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
      }),
      "Chargement de l’historique des abonnements",
    )
      .then((rows) => {
        if (active) setEntries(rows);
      })
      .catch((reason: unknown) => {
        if (active) setError(getErrorMessage(reason, "Impossible de charger l’historique."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title="Historique abonnements"
        subtitle="Journal des changements enregistrés sur les abonnements"
        icon={History}
        imageSrc={new URL("../assets/images/hero-super-admin-plateforme.jpg", import.meta.url).href}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Card>
        <CardContent className="divide-y p-0">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
              <span className="font-medium">{entry.action}</span>
              <time className="text-muted-foreground">
                {new Date(entry.created_at).toLocaleString("fr-FR")}
              </time>
            </div>
          ))}
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Chargement de l’historique…
            </p>
          ) : null}
          {!loading && !error && entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucun événement dans le journal.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
