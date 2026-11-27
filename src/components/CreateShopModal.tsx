import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { createShop, updateShop } from "@/services/shopService";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";

interface CreateShopModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (shopId: string) => void;
}

export function CreateShopModal({ open, onClose, onSuccess }: CreateShopModalProps) {
  const { values, setField, clear } = usePersistedFormState("create-shop-modal", {
    name: "",
    address: "",
    phone: "",
    entryFeeEnabled: false,
    entryFeeAmount: 2000,
    raisonSociale: "",
    capitalSocial: "",
    rc: "",
    cc: "",
    adresseBp: "",
    localisationPhysique: "",
  });
  const {
    name,
    address,
    phone,
    entryFeeEnabled,
    entryFeeAmount,
    raisonSociale,
    capitalSocial,
    rc,
    cc,
    adresseBp,
    localisationPhysique,
  } = values;
  const [submitting, setSubmitting] = useState(false);
  const [locationPhoto, setLocationPhoto] = useState<File | null>(null);
  const [isLegalOpen, setIsLegalOpen] = useState(true);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Le nom de la boutique doit contenir au moins 2 caractères.");
      return;
    }

    const parsedCapital = Number(capitalSocial);
    if (
      !raisonSociale.trim() ||
      !capitalSocial.trim() ||
      !Number.isFinite(parsedCapital) ||
      parsedCapital < 0 ||
      !rc.trim() ||
      !cc.trim() ||
      !localisationPhysique.trim()
    ) {
      toast.error("Veuillez renseigner les informations légales obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const shop = await createShop({
        name: trimmedName,
        address: address.trim() || null,
        phone: phone.trim() || null,
        entry_fee_enabled: entryFeeEnabled,
        entry_fee_amount: entryFeeEnabled ? entryFeeAmount : 0,
        raison_sociale: raisonSociale.trim(),
        capital_social: parsedCapital,
        rc: rc.trim(),
        cc: cc.trim(),
        adresse_bp: adresseBp.trim() || null,
        localisation_physique: localisationPhysique.trim(),
      });
      let locationPhotoSaved = true;
      if (locationPhoto) {
        const photoPath = `${shop.id}/location.jpg`;
        try {
          const { error: uploadError } = await supabase.storage
            .from("shop-locations")
            .upload(photoPath, locationPhoto, {
              contentType: locationPhoto.type || "image/jpeg",
            });
          if (uploadError) throw uploadError;

          const { data: photoData } = supabase.storage
            .from("shop-locations")
            .getPublicUrl(photoPath);
          await updateShop(shop.id, { location_photo_url: photoData.publicUrl });
        } catch (error) {
          locationPhotoSaved = false;
          console.error("[CreateShopModal] Impossible d'enregistrer la photo GPS.", error);
          toast.error(
            error instanceof Error
              ? `Boutique créée, mais la photo GPS n'a pas été enregistrée : ${error.message}`
              : "Boutique créée, mais la photo GPS n'a pas été enregistrée.",
          );
        }
      }
      if (locationPhotoSaved) toast.success("Boutique créée.");
      clear();
      setLocationPhoto(null);
      onSuccess(shop.id);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer la boutique.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !submitting && onClose()}>
      <DialogContent className="card-3d max-h-[90vh] overflow-y-auto border-orange-100 bg-gradient-to-br from-orange-50/40 via-white to-green-50/40 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une boutique</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-shop-name">Nom de la boutique *</Label>
            <Input
              id="create-shop-name"
              value={name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Atelier Principal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-shop-address">Adresse</Label>
            <Input
              id="create-shop-address"
              value={address}
              onChange={(event) => setField("address", event.target.value)}
              placeholder="Adresse de la boutique"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-shop-phone">Téléphone</Label>
            <Input
              id="create-shop-phone"
              value={phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="Numéro de téléphone"
            />
          </div>
          <div className="space-y-4 rounded-lg border border-orange-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="create-entry-fee-enabled">Paiement à l'entrée en Atelier</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Le client paie-t-il pour l'entrée de l'appareil en réparation ?
                </p>
              </div>
              <Switch
                id="create-entry-fee-enabled"
                checked={entryFeeEnabled}
                onCheckedChange={(checked) => setField("entryFeeEnabled", checked)}
              />
            </div>
            {entryFeeEnabled ? (
              <div className="space-y-2">
                <Label htmlFor="create-entry-fee-amount">Montant (FCFA)</Label>
                <Input
                  id="create-entry-fee-amount"
                  type="number"
                  min={1}
                  value={entryFeeAmount}
                  onChange={(event) => setField("entryFeeAmount", Math.max(1, Number(event.target.value)))}
                />
              </div>
            ) : null}
          </div>
          <section className="rounded-lg border border-orange-100 p-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start px-0 text-left"
              aria-expanded={isLegalOpen}
              aria-controls="create-shop-legal-fields"
              onClick={() => setIsLegalOpen((open) => !open)}
            >
              {isLegalOpen ? "Masquer" : "Afficher"} les informations légales
              {!isLegalOpen ? " (champs marqués * obligatoires)" : ""}
            </Button>
            {isLegalOpen ? (
              <div id="create-shop-legal-fields" className="mt-4 grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-shop-raison-sociale">Raison sociale *</Label>
                  <Input
                    id="create-shop-raison-sociale"
                    type="text"
                    value={raisonSociale}
                    onChange={(event) => setField("raisonSociale", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-capital-social">Capital social (FCFA) *</Label>
                  <Input
                    id="create-shop-capital-social"
                    type="number"
                    min={0}
                    value={capitalSocial}
                    onChange={(event) => setField("capitalSocial", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-rc">Numéro RC *</Label>
                  <Input
                    id="create-shop-rc"
                    type="text"
                    value={rc}
                    onChange={(event) => setField("rc", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-cc">Numéro CC *</Label>
                  <Input
                    id="create-shop-cc"
                    type="text"
                    value={cc}
                    onChange={(event) => setField("cc", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-adresse-bp">Adresse BP</Label>
                  <Input
                    id="create-shop-adresse-bp"
                    type="text"
                    value={adresseBp}
                    onChange={(event) => setField("adresseBp", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-localisation">Localisation physique *</Label>
                  <Input
                    id="create-shop-localisation"
                    type="text"
                    value={localisationPhysique}
                    onChange={(event) => setField("localisationPhysique", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-shop-location-photo">Photo GPS</Label>
                  <Input
                    id="create-shop-location-photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setLocationPhoto(event.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-ivoirien bg-ivoirien-hover"
            onClick={() => void handleCreate()}
            disabled={submitting}
          >
            {submitting ? "Création…" : "Créer la boutique"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
