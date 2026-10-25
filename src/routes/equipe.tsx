import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Camera, Copy, Mail, MessageCircle, Trash2, UserCog, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInvitationModal } from "@/components/CreateInvitationModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { addShopMember } from "@/services/shopService";
import { getTeamMembers, removeTeamMember, uploadTeamAvatar, type TeamMember } from "@/services/teamService";
import { supabase } from "@/integrations/supabase/client";
import { cancelInvitation, getPendingInvitations, type PendingInvitation } from "@/services/invitationsService";

export const Route = createFileRoute("/equipe")({ component: EquipePage });

function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [open, setOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [avatarPreviews, setAvatarPreviews] = useState<Record<string, string>>({});
  const { shopId, loading: shopLoading } = useCurrentShop();

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    void getTeamMembers(shopId)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  const refreshInvitations = useCallback(async () => {
    if (!shopId) {
      setInvitations([]);
      setInvitationsLoading(false);
      return;
    }
    setInvitationsLoading(true);
    try {
      setInvitations(await getPendingInvitations(shopId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les invitations.");
    } finally {
      setInvitationsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    void refreshInvitations();
  }, [refreshInvitations]);

  async function copyInvitationCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copié.");
    } catch {
      toast.error("Impossible de copier le code depuis ce navigateur.");
    }
  }

  async function removeInvitation(invitation: PendingInvitation) {
    if (!window.confirm(`Annuler l'invitation de ${invitation.full_name} ?`)) return;
    try {
      await cancelInvitation(invitation.id);
      toast.success("Invitation annulée.");
      await refreshInvitations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'annuler l'invitation.");
    }
  }

  function sendInvitationWhatsapp(invitation: PendingInvitation) {
    const message = `Bonjour ${invitation.full_name}, voici votre code d'invitation GogoSoft : ${invitation.code}\nAllez sur ${window.location.origin}/rejoindre et entrez ce code pour créer votre compte.`;
    window.open(buildWhatsappLink(invitation.whatsapp, message), "_blank", "noopener,noreferrer");
  }

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

      if (!shopId) {
        toast.error("Aucun atelier actif.");
        return;
      }

      await addShopMember(shopId, foundUser.id, "technicien");
      toast.success("Membre ajouté à l'atelier.");
      setOpen(false);
      setEmail("");
      setMembers(await getTeamMembers(shopId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation impossible.");
    }
  }

  async function refreshMembers() {
    if (!shopId) return;
    setMembers(await getTeamMembers(shopId));
  }

  async function changeAvatar(member: TeamMember, file: File | undefined) {
    if (!shopId || !file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreviews((current) => ({ ...current, [member.user_id]: preview }));
    try {
      await uploadTeamAvatar(shopId, member.user_id, file);
      toast.success("Photo de profil mise à jour.");
      await refreshMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer la photo.");
    } finally {
      URL.revokeObjectURL(preview);
      setAvatarPreviews((current) => {
        if (current[member.user_id] !== preview) return current;
        const next = { ...current };
        delete next[member.user_id];
        return next;
      });
    }
  }

  async function removeMember(member: TeamMember) {
    if (!shopId || member.role === "owner") return;
    const displayName = member.full_name ?? member.email ?? "ce membre";
    if (!window.confirm(`Retirer ${displayName} de l'équipe ?`)) return;
    try {
      await removeTeamMember(shopId, member.user_id);
      toast.success("Membre retiré de l'équipe.");
      await refreshMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de retirer ce membre.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title="Mes techniciens"
        subtitle="Collaborez avec votre équipe et gérez les accès."
        icon={UserCog}
        iconColor="green"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Mail className="size-4" /> Ajouter un compte existant
            </Button>
            <Button onClick={() => setInvitationOpen(true)} className="bg-ivoirien bg-ivoirien-hover">
              <UserPlus className="size-4" /> Inviter un employé
            </Button>
          </div>
        }
        breadcrumb={[{ label: "Accueil", to: "/dashboard" }, { label: "Équipe" }]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shopLoading || loading ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Chargement des membres…
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={Users}
              title="Aucun membre dans l'équipe"
              description="Invitez un membre pour lui donner accès à cet atelier."
              actionLabel="Inviter un membre"
              onAction={() => setInvitationOpen(true)}
            />
          </div>
        ) : (
          [...members]
            .sort((first, second) => Number(second.role === "owner") - Number(first.role === "owner"))
            .map((member) => {
              const displayName = member.full_name ?? member.email ?? member.user_id ?? "Membre";
              const avatarUrl = avatarPreviews[member.user_id] ?? member.avatar_url;
              return (
                <Card key={member.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={`Photo de ${displayName}`} className="size-16 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-800">
                          {(displayName.trim().slice(0, 1) || "?").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">{member.email ?? "E-mail indisponible"}</p>
                        <p className="truncate text-sm text-muted-foreground">WhatsApp : {member.whatsapp ?? "—"}</p>
                        <span className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                          {member.role || "Inconnu"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 hover:text-orange-700">
                        <Camera className="size-4" /> Changer la photo
                        <Input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-label={`Changer la photo de ${displayName}`}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            void changeAvatar(member, file);
                          }}
                        />
                      </label>
                      {member.role !== "owner" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Retirer ${displayName} de l'équipe`}
                          title="Retirer de l'équipe"
                          onClick={() => void removeMember(member)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitations en attente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invitationsLoading || shopLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des invitations…</p>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune invitation en attente.</p>
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{invitation.full_name}</p>
                  <p className="text-sm text-muted-foreground">{invitation.whatsapp}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{invitation.role}</p>
                  <p className="text-xs text-muted-foreground">
                    Expire le {new Date(invitation.expires_at).toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold tracking-[0.2em] text-orange-700">
                    {invitation.code}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyInvitationCode(invitation.code)}>
                    <Copy className="size-4" /> Copier le code
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => sendInvitationWhatsapp(invitation)}>
                    <MessageCircle className="size-4" /> Envoyer par WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    aria-label={`Annuler l'invitation de ${invitation.full_name}`}
                    onClick={() => void removeInvitation(invitation)}
                  >
                    <X className="size-4" /> Annuler
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateInvitationModal
        open={invitationOpen}
        onClose={() => setInvitationOpen(false)}
        onSuccess={() => void refreshInvitations()}
        shopId={shopId ?? ""}
      />

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
