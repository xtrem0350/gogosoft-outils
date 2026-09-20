import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_TOOLS } from "@/lib/demoData";

export const Route = createFileRoute("/outils/$id")({ component: ToolDetailsPage });

function ToolDetailsPage() {
  const { id } = Route.useParams();
  const tool = DEMO_TOOLS.find((item) => item.nom === decodeURIComponent(id));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/outils">
            <ArrowLeft /> Retour aux outils
          </Link>
        </Button>
        <Card className="card-elevated border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3 text-primary"><Boxes className="size-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Détail de l&apos;outil</p>
                <CardTitle>{tool?.nom ?? "Outil introuvable"}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tool ? (
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <p><span className="font-medium">Version :</span> {tool.version ?? "Non renseignée"}</p>
                <p><span className="font-medium">Catégorie :</span> {tool.categorie}</p>
                <p className="sm:col-span-2"><span className="font-medium">Chemin :</span> <code className="font-mono text-xs">{tool.chemin}</code></p>
                <p className="text-muted-foreground sm:col-span-2">{tool.description}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Cet outil n&apos;existe pas dans le catalogue de démonstration.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
