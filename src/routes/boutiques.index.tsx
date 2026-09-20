import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { ShopCard } from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserShops, type Shop } from "@/services/shopService";

export const Route = createFileRoute("/boutiques/")({
  component: BoutiquesPage,
});

function BoutiquesPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getUserShops()
      .then(setShops)
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Boutiques</p>
          <h1 className="mt-2 text-3xl font-bold">Mes boutiques</h1>
        </div>
        <Button asChild>
          <Link to="/boutiques/nouveau">
            <Plus />
            Nouvelle boutique
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Chargement des boutiques...</CardContent>
        </Card>
      ) : shops.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucune boutique pour le moment.
            <div className="mt-4">
              <Button onClick={() => void navigate({ to: "/boutiques/nouveau" })}>Créer une boutique</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} isCurrent={shop.id === window.localStorage.getItem("gogosoft.currentShopId")} />
          ))}
        </div>
      )}
    </div>
  );
}
