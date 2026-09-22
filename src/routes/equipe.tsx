import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addShopMember, getShopMembers } from "@/services/shopService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/equipe")({ component: EquipePage });

function EquipePage() {
  const [members, setMembers] = useState<
    Array<{ id: string; user_id: string; role: string; created_at?: string | null }>
  >([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shopId = window.localStorage.getItem("gogosoft.currentShopId");
    if (!shopId) {
      setLoading(false);
      return;
    }

    void getShopMembers(shopId)
      .then((data) =>
        setMembers(
          data as Array<{ id: string; user_id: string; role: string; created_at?: string | null }>,
        ),
      )
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  async function inviteMember() {
    try {
      const { data: foundUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();
      if (!foundUser?.id) {
        toast.error("Aucun utilisateur trouvé pour cet e-mail.");
        return;
      }

      const shopId = window.localStorage.getItem("gogosoft.currentShopId");
      if (!shopId) {
        toast.error("Aucune boutique active.");
        return;
      }

      await addShopMember(shopId, foundUser.id, "technicien");
      toast.success("Membre ajouté à la boutique.");
      setOpen(false);
      setEmail("");
      const next = await getShopMembers(shopId);
      setMembers(
        next as Array<{ id: string; user_id: string; role: string; created_at?: string | null }>,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Collaboration</p>
          <h1 className="mt-2 text-3xl font-bold">Équipe</h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Inviter un membre
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Chargement des membres…
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucun membre dans cette boutique.
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {member.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.user_id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Retirer" title="Retirer">
                  <UserMinus className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="member-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="member-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-9"
                placeholder="prenom@exemple.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void inviteMember()}>Inviter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
