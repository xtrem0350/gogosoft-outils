import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { MemberOption } from "@/components/selects/MemberSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface QuickCreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onCreated: (member: MemberOption) => void;
}

export function QuickCreateMemberDialog({
  open,
  onOpenChange,
  shopId,
  onCreated,
}: QuickCreateMemberDialogProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "technicien">("technicien");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setPhone("");
    setEmail("");
    setRole("technicien");
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("Sélectionnez une boutique avant d'ajouter un membre.");
      return;
    }
    setSaving(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", email.trim())
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        throw new Error(
          "Aucun compte existant ne correspond à cet e-mail. L'invitation nécessite encore un service serveur.",
        );
      }

      const { error: memberError } = await supabase.from("shop_members").insert({
        shop_id: shopId,
        user_id: profile.id,
        role,
      });
      if (memberError) throw memberError;

      onCreated({
        user_id: profile.id,
        role,
        name: profile.full_name || profile.email || fullName.trim(),
      });
      onOpenChange(false);
      toast.success("Membre ajouté à la boutique.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'ajouter le membre.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Associez un compte existant à cette boutique. L'invitation de nouveaux comptes sera
            disponible après connexion d'un service serveur sécurisé. Le téléphone est demandé
            comme référence, mais le schéma actuel des membres ne permet pas de l'enregistrer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-member-name">Nom complet</Label>
            <Input
              id="quick-member-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-member-email">E-mail du compte existant</Label>
            <Input
              id="quick-member-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-member-phone">Téléphone (optionnel)</Label>
            <Input
              id="quick-member-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-member-role">Rôle</Label>
            <select
              id="quick-member-role"
              value={role}
              onChange={(event) => setRole(event.target.value as "owner" | "technicien")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="technicien">Technicien</option>
              <option value="owner">Propriétaire</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !fullName.trim() || !email.trim()}
              className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d"
            >
              {saving ? "Ajout…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
