import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/services/teamService";

interface TeamMemberProfileModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  shopId: string;
}

export function TeamMemberProfileModal({
  open,
  onClose,
  member,
  shopId,
}: TeamMemberProfileModalProps) {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member) {
      setRoles([]);
      return;
    }

    let active = true;
    setLoading(true);
    async function loadRoles() {
      try {
        const { data, error } = await supabase
          .from("user_roles_by_shop" as never)
          .select("role")
          .eq("shop_id", shopId)
          .eq("user_id", member.user_id);
        if (!active) return;
        if (error) throw error;
        setRoles((data ?? []).map((row: { role: string }) => row.role));
      } catch (error) {
        if (!active) return;
        setRoles([]);
        toast.error(error instanceof Error ? error.message : "Impossible de charger les rôles cumulés.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRoles();

    return () => {
      active = false;
    };
  }, [member, open, shopId]);

  if (!member) return null;

  const displayName = member.full_name ?? member.email ?? member.user_id;
  const whatsapp = member.whatsapp?.replace(/[\s+]/g, "") ?? "";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fiche équipier</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar className="size-24">
            {member.avatar_url ? <AvatarImage src={member.avatar_url} alt={displayName} /> : null}
            <AvatarFallback className="text-2xl text-orange-800">
              {(displayName.trim().slice(0, 1) || "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{member.email ?? "E-mail indisponible"}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm">
            <a
              className="text-green-700 underline-offset-4 hover:underline"
              href={whatsapp ? `https://wa.me/${whatsapp}` : undefined}
            >
              WhatsApp : {member.whatsapp ?? "—"}
            </a>
            {member.email ? (
              <a className="text-green-700 underline-offset-4 hover:underline" href={`mailto:${member.email}`}>
                {member.email}
              </a>
            ) : null}
          </div>
          <Badge className={member.role === "owner" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
            Rôle actuel : {member.role || "Inconnu"}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Rôles cumulés</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun rôle cumulé.</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
