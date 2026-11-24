import { useEffect, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptEstimate,
  addEvent,
  markAsWaitingParts,
  receiveParts,
  rejectEstimate,
  sendEstimateToClient,
} from "@/services/workshopService";
import { buildWhatsappLink, buildWorkshopStatusMessage } from "@/lib/whatsapp";
import type { WorkshopTicket } from "@/types/database";
import { toast } from "sonner";

interface WorkshopActionsPanelProps {
  ticket: WorkshopTicket;
  onRefresh: () => void;
}

function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

export function WorkshopActionsPanel({ ticket, onRefresh }: WorkshopActionsPanelProps) {
  const [busy, setBusy] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [partsInput, setPartsInput] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState(
    String(ticket.price_final ?? ticket.price_estimate ?? 0),
  );
  const estimatedPrice = ticket.price_estimate ?? 0;
  const finalPriceAmount = finalPrice.trim() ? Number(finalPrice) : 0;
  const priceDifference = Number.isFinite(finalPriceAmount)
    ? finalPriceAmount - estimatedPrice
    : null;

  useEffect(() => {
    setFinalPrice(String(ticket.price_final ?? ticket.price_estimate ?? 0));
  }, [ticket.price_estimate, ticket.price_final]);

  async function sendEstimate() {
    if (!ticket.client_whatsapp) {
      toast.error("Ajoutez un numéro WhatsApp au client.");
      return;
    }
    setBusy(true);
    try {
      await sendEstimateToClient(ticket.id, "whatsapp");
      const device = [ticket.device_brand, ticket.device_model].filter(Boolean).join(" ");
      const message = `Bonjour ${ticket.client_name ?? ""}, voici le devis pour votre ${device || "appareil"} : ${formatFcfa(estimatedPrice)}.`;
      window.open(buildWhatsappLink(ticket.client_whatsapp, message), "_blank", "noopener,noreferrer");
      onRefresh();
      toast.success("Devis envoyé au client.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'envoyer le devis.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptEstimateForTicket() {
    setBusy(true);
    try {
      await acceptEstimate(ticket.id, ticket.client_name ?? "Client");
      onRefresh();
      toast.success("Devis accepté.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'accepter le devis.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await rejectEstimate(ticket.id, rejectReason.trim());
      setRejectDialogOpen(false);
      setRejectReason("");
      onRefresh();
      toast.success("Devis refusé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de refuser le devis.");
    } finally {
      setBusy(false);
    }
  }

  function addPart() {
    const name = partsInput.trim();
    if (!name) return;
    setParts((current) => [...current, name]);
    setPartsInput("");
  }

  async function submitWaitingParts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parts.length) {
      toast.error("Ajoutez au moins une pièce nécessaire.");
      return;
    }
    setBusy(true);
    try {
      await markAsWaitingParts(ticket.id, parts.map((name) => ({ name })));
      setPartsDialogOpen(false);
      setParts([]);
      setPartsInput("");
      onRefresh();
      toast.success("Fiche mise en attente de pièces.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de mettre la fiche en attente.");
    } finally {
      setBusy(false);
    }
  }

  async function markPartsReceived() {
    setBusy(true);
    try {
      await receiveParts(ticket.id);
      onRefresh();
      toast.success("Pièces reçues.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'enregistrer la réception des pièces.");
    } finally {
      setBusy(false);
    }
  }

  async function sendStatusMessage(status: "en_cours" | "en_attente_caissier_solde") {
    if (!ticket.client_whatsapp) {
      toast.error("Ajoutez un numéro WhatsApp au client.");
      return;
    }
    setBusy(true);
    try {
      const message = buildWorkshopStatusMessage(status, ticket);
      window.open(buildWhatsappLink(ticket.client_whatsapp, message), "_blank", "noopener,noreferrer");
      await addEvent(ticket.id, "whatsapp_sent", "Message envoyé");
      toast.success("Message WhatsApp envoyé.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible d'envoyer le message WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  const pendingParts = ticket.pieces_en_attente ?? [];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {ticket.status === "en_attente_technicien" || ticket.status === "devis_envoye" ? (
            <Button type="button" disabled={busy} onClick={() => void sendEstimate()}>
              📤 Envoyer le devis
            </Button>
          ) : null}
          {ticket.status === "devis_envoye" ? (
            <>
              <Button type="button" disabled={busy} onClick={() => void acceptEstimateForTicket()}>
                ✅ Marquer accepté
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRejectDialogOpen(true)}
              >
                ❌ Refuser
              </Button>
              <Badge variant="secondary">⏳ En attente d'accord client</Badge>
            </>
          ) : null}
          {ticket.status === "en_cours" ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setPartsDialogOpen(true)}
            >
              ⏳ En attente de pièces
            </Button>
          ) : null}
          {ticket.status === "en_attente_pieces" ? (
            <Button type="button" disabled={busy} onClick={() => void markPartsReceived()}>
              ✅ Pièces reçues
            </Button>
          ) : null}
          {ticket.status === "en_cours" ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy || !ticket.client_whatsapp}
              onClick={() => void sendStatusMessage("en_cours")}
            >
              📱 En cours
            </Button>
          ) : null}
          {ticket.status === "en_attente_caissier_solde" ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy || !ticket.client_whatsapp}
              onClick={() => void sendStatusMessage("en_attente_caissier_solde")}
            >
              📱 Prêt
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onRefresh}>
            🔄 Recharger
          </Button>
        </div>

        {ticket.status === "en_cours" || ticket.status === "en_attente_pieces" ? (
          <div className="grid gap-3 sm:max-w-md">
            <div className="grid gap-1">
              <Label htmlFor={`estimate-price-${ticket.id}`}>Prix estimé (devis)</Label>
              <Input
                id={`estimate-price-${ticket.id}`}
                value={ticket.price_estimate === null ? "—" : formatFcfa(ticket.price_estimate)}
                readOnly
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`final-price-${ticket.id}`}>Prix final réel</Label>
              <Input
                id={`final-price-${ticket.id}`}
                type="number"
                min="0"
                step="1"
                value={finalPrice}
                onChange={(event) => setFinalPrice(event.target.value)}
              />
            </div>
            <p
              className={`text-sm font-medium ${
                priceDifference === 0
                  ? "text-green-700"
                  : priceDifference === null
                    ? "text-muted-foreground"
                    : "text-red-700"
              }`}
            >
              Écart :{" "}
              {priceDifference === null
                ? "—"
                : `${priceDifference > 0 ? "+" : ""}${formatFcfa(priceDifference)}`}
            </p>
          </div>
        ) : null}

        {pendingParts.length ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              <h3 className="font-semibold">Pièces en attente</h3>
              <ul className="list-inside list-disc text-sm">
                {pendingParts.map((part, index) => (
                  <li key={`${typeof part === "string" ? part : part.name}-${index}`}>
                    {typeof part === "string"
                      ? part
                      : `${part.name}${part.qty ? ` × ${part.qty}` : ""}`}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </CardContent>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le devis</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void submitRejection(event)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={`reject-reason-${ticket.id}`}>Motif du refus</Label>
              <Input
                id={`reject-reason-${ticket.id}`}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRejectDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={busy}>
                Confirmer le refus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={partsDialogOpen} onOpenChange={setPartsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre en attente de pièces</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void submitWaitingParts(event)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={`waiting-part-${ticket.id}`}>Pièce nécessaire</Label>
              <div className="flex gap-2">
                <Input
                  id={`waiting-part-${ticket.id}`}
                  value={partsInput}
                  onChange={(event) => setPartsInput(event.target.value)}
                />
                <Button type="button" variant="outline" onClick={addPart}>
                  Ajouter
                </Button>
              </div>
            </div>
            {parts.length ? (
              <ul className="list-inside list-disc text-sm">
                {parts.map((part, index) => (
                  <li key={`${part}-${index}`}>{part}</li>
                ))}
              </ul>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setPartsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={busy || parts.length === 0}>
                Confirmer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
