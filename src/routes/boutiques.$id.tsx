import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShopById, getShopMembers, deleteShop, type Shop } from "@/services/shopService";

export const Route = createFileRoute("/boutiques/$id")({
  component: ShopDetailsPage,
});

function ShopDetailsPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [members, setMembers] = useState<
    Array<{ id: string; user_id: string; role: string; created_at?: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [shopData, membersData] = await Promise.all([getShopById(id), getShopMembers(id)]);
        setShop(shopData);
        setMembers(
          membersData as Array<{
            id: string;
            user_id: string;
            role: string;
            created_at?: string | null;
          }>,
        );
      } catch {
        setShop(null);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  async function handleDelete() {
    try {
      await deleteShop(id);
      toast.success("Atelier supprimé.");
      await navigate({ to: "/boutiques" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  const memberCount = useMemo(() => members.length, [members.length]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement de l'atelier…</div>;
  }

  if (!shop) {
    return <div className="p-6 text-sm text-muted-foreground">Atelier introuvable.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Atelier</p>
          <h1 className="mt-2 text-3xl font-bold">{shop.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info("Fonctionnalité de modification à compléter.")}
          >
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Nom :</span> {shop.name}
            </p>
            <p>
              <span className="font-semibold">Adresse :</span> {shop.address || "—"}
            </p>
            <p>
              <span className="font-semibold">Téléphone :</span> {shop.phone || "—"}
            </p>
            <p>
              <span className="font-semibold">Nombre de membres :</span> {memberCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <CardTitle>Membres</CardTitle>
            <Button
              size="sm"
              onClick={() => toast.info("Invitation à ajouter un membre à compléter.")}
            >
              <UserPlus className="size-4" />
              Ajouter un membre
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun membre pour cet atelier.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{member.user_id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {member.created_at
                      ? new Date(member.created_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
