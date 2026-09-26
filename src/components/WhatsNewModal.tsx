import { useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLatestReleaseNote, hasNewVersion, setLastSeenVersion } from "@/lib/changelog";

interface WhatsNewModalProps {
  open: boolean;
  enabled: boolean;
  onOpenChange: (open: boolean) => void;
  onRead: () => void;
}

export function WhatsNewModal({
  open,
  enabled,
  onOpenChange,
  onRead,
}: WhatsNewModalProps) {
  const note = getLatestReleaseNote();

  useEffect(() => {
    if (!enabled || !hasNewVersion()) return;
    const timer = window.setTimeout(() => onOpenChange(true), 1500);
    return () => window.clearTimeout(timer);
  }, [enabled, onOpenChange]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && open) {
      setLastSeenVersion(note.version);
      onRead();
    }
    onOpenChange(nextOpen);
  }

  const formattedDate = new Date(`${note.date}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-0 p-0">
        <div className="bg-hero-ivoirien relative p-6">
          <div className="flex items-center gap-3 pr-10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/40 text-2xl backdrop-blur">
              {note.emoji}
            </div>
            <DialogHeader className="space-y-1 text-left">
              <Badge className="w-fit border-0 bg-white/40 text-slate-900">v{note.version}</Badge>
              <DialogTitle className="text-xl text-slate-900">{note.title}</DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-orange-500" />
            <span>Nouveautés du {formattedDate}</span>
          </div>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {note.highlights.map((highlight, index) => (
              <li
                key={`${note.version}-${index}`}
                className="animate-in slide-in-from-left-4 fade-in flex items-start gap-3 rounded-lg bg-orange-50/60 p-3 text-sm text-foreground duration-300 dark:bg-orange-950/20"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 bg-card px-6 pb-6">
          <Button
            onClick={() => handleOpenChange(false)}
            className="h-11 flex-1 rounded-xl bg-ivoirien font-semibold shadow-3d hover:bg-ivoirien-hover"
          >
            C'est parti <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
