import {
  CheckCircle,
  Inbox,
  MessageSquare,
  Package,
  Search,
  Truck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { WorkshopEvent, WorkshopEventType } from "@/services/workshopService";

const EVENT_META: Record<WorkshopEventType, { icon: LucideIcon; label: string; color: string }> = {
  received: { icon: Inbox, label: "Appareil reçu", color: "text-blue-600" },
  diagnosed: { icon: Search, label: "Diagnostic effectué", color: "text-violet-600" },
  in_progress: { icon: Wrench, label: "Réparation en cours", color: "text-orange-500" },
  waiting_parts: { icon: Package, label: "En attente de pièces", color: "text-yellow-500" },
  completed: { icon: CheckCircle, label: "Réparation terminée", color: "text-green-600" },
  delivered: { icon: Truck, label: "Appareil livré", color: "text-blue-900 dark:text-blue-300" },
  cancelled: { icon: XCircle, label: "Intervention annulée", color: "text-red-600" },
  note: { icon: MessageSquare, label: "Note", color: "text-slate-500" },
};

/** Libellés lisibles des types d'événements d'atelier. */
export const WORKSHOP_EVENT_LABELS = Object.fromEntries(
  Object.entries(EVENT_META).map(([key, meta]) => [key, meta.label]),
) as Record<WorkshopEventType, string>;

interface WorkshopTimelineProps {
  events: WorkshopEvent[];
}

/** Affiche l'historique chronologique d'une intervention. */
export function WorkshopTimeline({ events }: WorkshopTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun événement pour l'instant. Ajoutez-en un ci-dessous.
      </p>
    );
  }
  return (
    <ol className="relative space-y-4 border-l pl-6">
      {events.map((event) => {
        const meta = EVENT_META[event.event_type] ?? EVENT_META.note;
        const Icon = meta.icon;
        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[2.15rem] flex size-6 items-center justify-center rounded-full border bg-background">
              <Icon className={`size-3.5 ${meta.color}`} />
            </span>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-xs text-muted-foreground">
                  {event.created_at ? new Date(event.created_at).toLocaleString("fr-FR") : ""}
                </p>
              </div>
              {event.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
