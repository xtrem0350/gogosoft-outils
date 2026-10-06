import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { getAllTenants, getTenantHistory } from "@/services/adminService";

export const Route = createFileRoute("/admin/tenants/historique")({ component: TenantHistoryPage });

function TenantHistoryPage() {
  const [entries, setEntries] = useState<Array<{ id: string; action: string; metadata: unknown; created_at: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getAllTenants().then(async (tenants) => { const rows = await Promise.all(tenants.map((tenant) => getTenantHistory(tenant.id))); setEntries(rows.flat().sort((a, b) => b.created_at.localeCompare(a.created_at))); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")); }, []);
  return <div className="mx-auto max-w-5xl space-y-6"><PageHero title="Historique abonnements" subtitle="Journal des changements enregistrés sur les abonnements" icon={History} />{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<Card><CardContent className="divide-y p-0">{entries.map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><span className="font-medium">{entry.action}</span><time className="text-muted-foreground">{new Date(entry.created_at).toLocaleString("fr-FR")}</time></div>)}{entries.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Aucun événement dans le journal.</p> : null}</CardContent></Card></div>;
}