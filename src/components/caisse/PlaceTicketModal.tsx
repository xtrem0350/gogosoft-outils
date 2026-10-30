import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StorageLocationSelect } from "@/components/selects/StorageLocationSelect";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { placeTicketInStorage } from "@/services/workshopService";
import type { StorageLocation } from "@/services/storageService";

interface PlaceTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    ticket_number?: string | null;
    client_name?: string | null;
    device_brand?: string | null;
    device_model?: string | null;
  } | null;
  onSuccess: () => void;
}

export function PlaceTicketModal({
  open,
  onClose,
  ticket,
  onSuccess,
}: PlaceTicketModalProps) {
  const { shopId } = useCurrentShop();
  const [location, setLocation] = useState<StorageLocation>();

  useEffect(() => {
    if (open) setLocation(undefined);
  }, [open, ticket?.id]);

  if (!ticket) return null;

  async function confirmPlacement() {
    if (!ticket || !location) return;
    try {
      await placeTicketInStorage(ticket.id, location.id);
      toast.success(`Fiche rangée en [${location.name}]. Technicien notifié.`);
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de ranger la fiche.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="card-3d max-w-md border-orange-100 shadow-3d">
        <DialogHeader>
          <DialogTitle>Ranger la fiche {ticket.ticket_number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 text-sm">
          <p><strong>Fiche :</strong> {ticket.ticket_number}</p>
          <p><strong>Client :</strong> {ticket.client_name}</p>
          <p><strong>Appareil :</strong> {[ticket.device_brand, ticket.device_model].filter(Boolean).join(" ") || "—"}</p>
        </div>
        <StorageLocationSelect
          shopId={shopId ?? null}
          value={location?.id}
          onSelect={setLocation}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" disabled={!location} className="bg-ivoirien bg-ivoirien-hover" onClick={() => void confirmPlacement()}>
            Confirmer le rangement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
