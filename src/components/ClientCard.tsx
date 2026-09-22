/** Carte récapitulative d'un client. */
import { ArrowUpRight, MessageCircle, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ClientRecord } from "@/services/clientService";

interface ClientCardProps {
  client: ClientRecord;
}

function getWhatsAppLink(phone: string, name: string) {
  const cleaned = phone.replace(/[\s+\-()]/g, "").replace(/\D/g, "");
  const message = encodeURIComponent(`Bonjour ${name}, votre appareil est prêt.`);
  return `https://wa.me/${cleaned}?text=${message}`;
}

/** Affiche les informations essentielles d'un client avec un CTA vers sa fiche. */
export function ClientCard({ client }: ClientCardProps) {
  const initials =
    client.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "C";

  return (
    <Card className="border-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{client.full_name}</p>
            <a
              href={getWhatsAppLink(client.whatsapp, client.full_name)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MessageCircle className="size-3.5" />
              {client.whatsapp}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {client.total_repairs ?? 0} réparation(s)
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={`/clients/${client.id}`}>
            Voir la fiche
            <ArrowUpRight className="size-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
