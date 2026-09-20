import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profil")({ component: ProfilPage });

function ProfilPage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Compte</p><h1 className="mt-2 text-3xl font-bold">Profil</h1><p className="mt-2 text-muted-foreground">Retrouvez vos informations, votre rôle et votre activité personnelle.</p></div>;
}
