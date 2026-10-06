import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHero } from "@/components/PageHero";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalStats, getGrowthChart, type AdminStats } from "@/services/adminService";

export const Route = createFileRoute("/admin/finances")({ component: FinancesPage });

function FinancesPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growth, setGrowth] = useState<Array<{ month: string; signups: number }>>([]);
  useEffect(() => { void Promise.all([getGlobalStats(), getGrowthChart()]).then(([nextStats, nextGrowth]) => { setStats(nextStats); setGrowth(nextGrowth); }); }, []);
  return <div className="mx-auto max-w-7xl space-y-6"><PageHero title="Revenus & MRR" subtitle="Revenus récurrents et croissance des abonnements" icon={TrendingUp} /><div className="grid gap-4 sm:grid-cols-3"><StatsCard title="MRR" value={stats?.mrr_fcfa.toLocaleString("fr-FR") ?? "…"} icon={TrendingUp} /><StatsCard title="ARR estimé" value={stats ? (stats.mrr_fcfa * 12).toLocaleString("fr-FR") : "…"} icon={TrendingUp} color="success" /><StatsCard title="Churn estimé" value={stats ? `${stats.churn_rate}%` : "…"} icon={TrendingUp} color="danger" /></div><Card><CardHeader><CardTitle>Croissance des abonnés</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={growth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="signups" name="Nouveaux abonnés" stroke="#f97316" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card></div>;
}