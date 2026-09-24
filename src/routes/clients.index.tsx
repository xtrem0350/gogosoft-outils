import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { ClientCard } from "@/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getClientsByShop, searchClients, type ClientRecord } from "@/services/clientService";

export const Route = createFileRoute("/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { shopId, loading: shopLoading } = useCurrentShop();

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    void getClientsByShop(shopId)
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  async function handleSearch(value: string) {
    setQuery(value);
    if (!shopId) return;
    const next = value.trim() ? await searchClients(shopId, value) : await getClientsByShop(shopId);
    setClients(next);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Clients</p>
          <h1 className="mt-2 text-3xl font-bold">Liste des clients</h1>
        </div>
        <Button asChild>
          <Link to="/clients/nouveau">
            <Plus />
            Nouveau client
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => void handleSearch(event.target.value)}
          className="pl-9"
          placeholder="Rechercher un client"
        />
      </div>

      {shopLoading || loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Chargement des clients...
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucun client pour cette boutique.
            <div className="mt-4">
              <Button onClick={() => void navigate({ to: "/clients/nouveau" })}>
                Créer un client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
