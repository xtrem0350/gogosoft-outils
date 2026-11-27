import { Mail, Phone } from "lucide-react";

import profilePhoto from "@/assets/images/profile.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDeveloperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDeveloperModal({
  open,
  onOpenChange,
}: AboutDeveloperModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-5 overflow-y-auto">
        <DialogHeader className="flex-row items-center gap-4 space-y-0 text-left">
          <img
            src={profilePhoto}
            alt="Portrait de Thierry Gogo"
            className="size-20 shrink-0 rounded-full object-cover"
          />
          <div className="space-y-1">
            <DialogTitle className="text-xl">Thierry Gogo</DialogTitle>
            <p className="text-sm font-medium text-primary">Développeur Web</p>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Passionné par le développement d&apos;outils numériques adaptés aux
            réalités africaines, je conçois des solutions simples et efficaces
            pour les réparateurs et commerçants.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a
              href="tel:0758966156"
              className="inline-flex items-center gap-2 font-medium hover:text-primary"
            >
              <Phone className="size-4" />
              0758966156
            </a>
            <a
              href="mailto:2024dibo@gmail.com"
              className="inline-flex items-center gap-2 font-medium hover:text-primary"
            >
              <Mail className="size-4" />
              2024dibo@gmail.com
            </a>
          </div>

          <section aria-labelledby="developer-gallery-title" className="space-y-3">
            <h3 id="developer-gallery-title" className="font-semibold">
              Quelques captures de mes réalisations
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  role="img"
                  aria-label={`Capture ${index + 1} à venir`}
                  className="grid aspect-video place-items-center rounded-lg border bg-muted px-2 text-center text-xs font-medium text-muted-foreground"
                >
                  Capture à venir
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
