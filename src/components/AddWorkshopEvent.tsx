import { useState } from "react";
import { toast } from "sonner";

import { WORKSHOP_EVENT_LABELS } from "@/components/WorkshopTimeline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addEvent, type WorkshopEventType } from "@/services/workshopService";

interface AddWorkshopEventProps {
  ticketId: string;
  onAdded: () => void;
}

const EVENT_TYPES = Object.keys(WORKSHOP_EVENT_LABELS) as WorkshopEventType[];

/** Formulaire en ligne d'ajout d'un événement à l'historique. */
export function AddWorkshopEvent({ ticketId, onAdded }: AddWorkshopEventProps) {
  const [eventType, setEventType] = useState<WorkshopEventType>("note");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await addEvent(ticketId, eventType, description.trim() || undefined);
      setDescription("");
      toast.success("Événement ajouté.");
      onAdded();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Type d'événement</Label>
        <Select value={eventType} onValueChange={(value) => setEventType(value as WorkshopEventType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {WORKSHOP_EVENT_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-description">Description (optionnelle)</Label>
        <Textarea
          id="event-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ex: Écran commandé chez le fournisseur, livraison sous 2 jours."
        />
      </div>
      <Button type="button" onClick={() => void submit()} disabled={saving}>
        Ajouter
      </Button>
    </div>
  );
}
