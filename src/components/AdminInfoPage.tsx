import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminInfoPage({
  title,
  description,
  icon: Icon,
  destination,
  action,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  destination: string;
  action: string;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero title={title} subtitle={description} icon={Icon} />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Les données de cette rubrique sont centralisées dans l'espace de gestion correspondant.
          </p>
          <Button asChild>
            <Link to={destination as any}>{action}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
