import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getTeamMembers, type TeamMember } from "@/services/teamService";

const POSTES = [
  { key: "receptionniste", label: "Accueil / Réceptionniste", icon: "🤝" },
  { key: "caissier", label: "Caisse", icon: "💰" },
  { key: "technicien", label: "Atelier / Technicien", icon: "🔧" },
  { key: "magasinier", label: "Stock / Magasinier", icon: "📦" },
  { key: "vendeur", label: "Vente / Vendeur", icon: "🛒" },
  { key: "owner", label: "Chef d'Atelier (signataire)", icon: "✍️" },
] as const;

export function RoleAssignmentPlanPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopLoading) return;
    if (!shopId) {
      setMembers([]);
      setError("Aucun atelier sélectionné.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void getTeamMembers(shopId)
      .then((teamMembers) => {
        if (active) setMembers(teamMembers);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Impossible de charger les rôles de l'équipe.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shopId, shopLoading]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold">Plan d'affectation des rôles</h1>
        <p className="mt-2 text-muted-foreground">
          Visualisez qui occupe quel poste dans votre atelier. Ces informations permettent
          d'identifier les personnes responsables des documents et tickets.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : loading || shopLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des rôles de l'équipe…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POSTES.map((poste) => {
            const assignedMembers = members.filter((member) => member.role === poste.key);
            return (
              <Card key={poste.key} className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-4 p-5">
                  <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-3xl">
                    {poste.icon}
                  </span>
                  <CardTitle className="text-base">{poste.label}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {assignedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {assignedMembers.map((member) => (
                        <Badge key={member.id} className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
                          {member.full_name || member.email || "Membre"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Non assigné</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
