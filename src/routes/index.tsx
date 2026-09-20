import { createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Boxes, Clock3, Heart, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_TOOLS } from "@/lib/demoData";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <Dashboard />;
}

function Dashboard() {
  const favoriteCount = DEMO_TOOLS.filter((tool) => tool.favori).length;
  return <div className="mx-auto max-w-7xl space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-primary">Vue d'ensemble</p><h1 className="text-3xl font-bold tracking-tight">Bonjour, Thierry.</h1><p className="mt-2 text-muted-foreground">Votre atelier numérique, en un coup d'œil.</p></div><Button className="accent-gradient text-accent-foreground"><Plus /> Ajouter un outil</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Outils catalogués", value: DEMO_TOOLS.length, icon: Boxes, note: "+12% ce mois" }, { label: "Lancements aujourd'hui", value: 24, icon: Activity, note: "+8 depuis hier" }, { label: "Outils favoris", value: favoriteCount, icon: Heart, note: "À portée de main" }, { label: "Dernière activité", value: "09:42", icon: Clock3, note: "TSM PRO" }].map(({ label, value, icon: Icon, note }) => <Card key={label} className="card-elevated border-0"><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-success">{note}</p></div><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div></CardContent></Card>)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="card-elevated border-0"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Catalogue récent</CardTitle><p className="mt-1 text-sm text-muted-foreground">Les outils les plus utiles à votre équipe.</p></div><Button variant="ghost" size="sm">Voir tout <ArrowUpRight /></Button></CardHeader><CardContent className="space-y-3">{DEMO_TOOLS.slice(0, 5).map((tool) => <div key={tool.nom} className="flex items-center justify-between rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50"><div className="flex min-w-0 items-center gap-3"><div className="rounded-md bg-muted p-2 text-primary"><Boxes className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{tool.nom}</p><p className="truncate text-xs text-muted-foreground">{tool.categorie} · {tool.version}</p></div></div><span className="text-xs text-muted-foreground">{tool.type}</span></div>)}</CardContent></Card>
      <Card className="card-elevated border-0"><CardHeader><CardTitle>Activité récente</CardTitle><p className="mt-1 text-sm text-muted-foreground">Les dernières actions de l'atelier.</p></CardHeader><CardContent className="space-y-5">{["TSM PRO lancé", "SP Flash Tool ouvert", "Nouveau pilote ajouté"].map((item, index) => <div key={item} className="flex gap-3"><div className="mt-1 size-2 rounded-full bg-accent" /><div><p className="text-sm font-medium">{item}</p><p className="text-xs text-muted-foreground">Il y a {index + 1} heure{index ? "s" : ""}</p></div></div>)}</CardContent></Card>
    </div>
  </div>;
}
