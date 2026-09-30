import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PhoneInput } from "@/components/PhoneInput";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient, uploadClientPhoto, type ClientRecord } from "@/services/clientService";

interface QuickCreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onCreated: (client: ClientRecord) => void;
}

export function QuickCreateClientDialog({
  open,
  onOpenChange,
  shopId,
  onCreated,
}: QuickCreateClientDialogProps) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setWhatsapp("");
    setEmail("");
    setNotes("");
    setPhoto(null);
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shopId) {
      toast.error("Sélectionnez un atelier avant de créer un client.");
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 8) {
      toast.error("Saisissez un numéro WhatsApp valide.");
      return;
    }

    setSaving(true);
    try {
      const client = await createClient({
        shop_id: shopId,
        full_name: fullName.trim(),
        whatsapp,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      if (photo) {
        try {
          await uploadClientPhoto(client, photo);
        } catch {
          toast.error("Le client est créé, mais sa photo n'a pas pu être envoyée.");
        }
      }
      onCreated(client);
      onOpenChange(false);
      toast.success("Client créé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer le client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>Ajoutez un client à cette boutique.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-client-name">Nom complet *</Label>
            <Input
              id="quick-client-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp *</Label>
            <PhoneInput
              value={whatsapp}
              onChange={setWhatsapp}
              className="rounded-md bg-slate-900 p-1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-client-email">Email</Label>
            <Input
              id="quick-client-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-client-notes">Notes</Label>
            <Textarea
              id="quick-client-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-client-photo">Photo</Label>
            <Input
              id="quick-client-photo"
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
            {photo ? <p className="text-xs text-muted-foreground">{photo.name}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !fullName.trim()}
              className="bg-ivoirien bg-ivoirien-hover shadow-3d"
            >
              {saving ? "Création…" : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
