import { useState, type FormEvent } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { createInvitation, type InvitationRole, type PendingInvitation } from "@/services/invitationsService";

interface CreateInvitationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string;
}

export function CreateInvitationModal({ open, onClose, onSuccess, shopId }: CreateInvitationModalProps) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<InvitationRole>("technicien");
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    setInvitation(null);
    setFullName("");
    setWhatsapp("");
    setRole("technicien");
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("Aucun atelier actif.");
      return;
    }
    setSaving(true);
    try {
      const created = await createInvitation({
        shop_id: shopId,
        full_name: fullName,
        whatsapp,
        role,
      });
      setInvitation(created);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer l'invitation.");
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.code);
      toast.success("Code copié.");
    } catch {
      toast.error("Impossible de copier le code depuis ce navigateur.");
    }
  }

  function sendWhatsapp() {
    if (!invitation) return;
    const message = `Bonjour ${invitation.full_name}, voici votre code d'invitation GogoSoft : ${invitation.code}\nAllez sur ${window.location.origin}/rejoindre, entrez ce code et créez votre compte.\nCode valable 24h.`;
    window.open(buildWhatsappLink(invitation.whatsapp, message), "_blank", "noopener,noreferrer");
  }

  async function copyJoinLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/rejoindre`);
      toast.success("Lien copié.");
    } catch {
      toast.error("Impossible de copier le lien depuis ce navigateur.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && close()}>
      <DialogContent className="card-3d sm:max-w-md">
        {invitation ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation créée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Transmettez ce code à votre employé.</p>
              <p className="rounded-xl bg-orange-50 py-4 text-4xl font-bold tracking-[0.2em] text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                {invitation.code}
              </p>
              <p className="text-xs text-muted-foreground">Code valable 24h.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => void copyCode()}>
                  <Copy className="size-4" /> Copier le code
                </Button>
                <Button type="button" onClick={sendWhatsapp}>
                  <MessageCircle className="size-4" /> Envoyer par WhatsApp
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a href={`${window.location.origin}/rejoindre`} className="break-all text-sm text-primary underline">
                  {window.location.origin}/rejoindre
                </a>
                <Button type="button" variant="outline" onClick={() => void copyJoinLink()}>
                  <Copy className="size-4" /> Copier le lien
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={close}><Check className="size-4" /> Fermer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un employé</DialogTitle>
            </DialogHeader>
            <form onSubmit={(event) => void submit(event)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invitation-full-name">Nom complet</Label>
                <Input
                  id="invitation-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invitation-whatsapp">WhatsApp</Label>
                <Input
                  id="invitation-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  required
                  maxLength={30}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invitation-role">Rôle</Label>
                <Select value={role} onValueChange={(value) => setRole(value as InvitationRole)}>
                  <SelectTrigger id="invitation-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="caissier">Caissier</SelectItem>
                    <SelectItem value="magasinier">Magasinier</SelectItem>
                    <SelectItem value="receptionniste">Réceptionniste</SelectItem>
                    <SelectItem value="vendeur">Vendeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={saving}>Annuler</Button>
                <Button type="submit" disabled={saving || !shopId || !fullName.trim() || !whatsapp.trim()}>
                  {saving ? "Création…" : "Créer l'invitation"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
