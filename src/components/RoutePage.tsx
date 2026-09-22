import { Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, ClipboardList, Settings2, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoutePageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionTo?:
    | "/outils"
    | "/categories"
    | "/historique"
    | "/statistiques"
    | "/equipe"
    | "/parametres"
    | "/profil";
}

const quickLinks = [
  { label: "Catalogue des outils", to: "/outils", icon: Boxes },
  { label: "Historique des lancements", to: "/historique", icon: ClipboardList },
  { label: "Équipe", to: "/equipe", icon: UsersRound },
  { label: "Paramètres", to: "/parametres", icon: Settings2 },
] as const;

export function RoutePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  actionLabel,
  actionTo,
}: RoutePageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        {actionLabel && actionTo ? (
          <Button asChild>
            <Link to={actionTo}>
              {actionLabel}
              <ArrowRight />
            </Link>
          </Button>
        ) : null}
      </header>
      <Card className="card-elevated border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle>Vue prête à être configurée</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                La route est active. Les outils métier seront ajoutés à l&apos;étape suivante.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ label, to, icon: QuickIcon }) => (
            <Button key={to} asChild variant="outline" className="justify-start">
              <Link to={to}>
                <QuickIcon />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
