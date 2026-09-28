import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Archive, Box, Layers, Package, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { StorageLocationDialog } from "@/components/StorageLocationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { getTickets, type WorkshopTicket } from "@/services/workshopService";
import {
  deleteLocation,
  getLocationsByShop,
  type StorageLocation,
  type StorageLocationStatus,
} from "@/services/storageService";

const TYPE_ICONS: Record<StorageLocation["location_type"], ComponentType<{ className?: string }>> = {
  carton: Package,
  shelf: Layers,
  drawer: Archive,
  bag: ShoppingBag,
  other: Box,
};

const STATUS_LABELS: Record<StorageLocationStatus, string> = {
  available: "Libre",
  occupied: "Occupé",
  maintenance: "Maintenance",
};

const STATUS_CLASSES: Record<StorageLocationStatus, string> = {
  available: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-200",
  occupied: "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-200",
  maintenance: "bg-muted text-muted-foreground hover:bg-muted",
};

type Filter = "all" | StorageLocationStatus;

export function StorageLocationsPage({ plan = false }: { plan?: boolean }) {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [tickets, setTickets] = useState<WorkshopTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<StorageLocation | null>(null);

  const load = useCallback(async () => {
    if (!shopId) {
      setLocations([]);
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextLocations, nextTickets] = await Promise.all([
        getLocationsByShop(shopId),
        getTickets(shopId),
      ]);
      setLocations(nextLocations);
      setTickets(nextTickets);
    } catch (error) {
      console.error("[StorageLocationsPage] load:", error);
      toast.error("Impossible de charger les emplacements.");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopLoading) void load();
  }, [load, shopLoading]);

  const sortedLocations = useMemo(
    () => [...locations].sort((left, right) => left.name.localeCompare(right.name, "fr")),
    [locations],
  );
  const counts = useMemo(
    () => ({
      available: locations.filter((location) => location.status === "available").length,
      occupied: locations.filter((location) => location.status === "occupied").length,
      maintenance: locations.filter((location) => location.status === "maintenance").length,
    }),
    [locations],
  );
  const filteredLocations =
    filter === "all" ? sortedLocations : sortedLocations.filter((location) => location.status === filter);
  const ticketById = useMemo(
    () => new Map(tickets.map((ticket) => [ticket.id, ticket])),
    [tickets],
  );

  function editLocation(location: StorageLocation) {
    setEditingLocation(location);
    setDialogOpen(true);
  }

  function createLocation() {
    setEditingLocation(null);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingLocation) return;
    const deleted = await deleteLocation(deletingLocation.id);
    if (!deleted) {
      toast.error("Impossible de supprimer cet emplacement.");
      return;
    }
    toast.success("Emplacement supprimé.");
    setDeletingLocation(null);
    await load();
  }

  const heading = plan
    ? { title: "🗄️ Plan de mon atelier", subtitle: "Visualisez tous vos emplacements" }
    : { title: "📦 Mes emplacements", subtitle: "Organisez votre atelier comme vous voulez" };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={heading.title}
        subtitle={heading.subtitle}
        action={
          <Button type="button" onClick={createLocation} disabled={!shopId}>
            <Plus className="size-4" /> Ajouter un emplacement
          </Button>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Libres</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{counts.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Occupés</p>
            <p className="mt-1 text-2xl font-bold text-orange-700">{counts.occupied}</p>
          </CardContent>
        </Card>
        {!plan ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="mt-1 text-2xl font-bold">{counts.maintenance}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">Tous ({locations.length})</TabsTrigger>
          <TabsTrigger value="available">Libres ({counts.available})</TabsTrigger>
          <TabsTrigger value="occupied">Occupés ({counts.occupied})</TabsTrigger>
          {plan ? (
            <TabsTrigger value="maintenance">Maintenance ({counts.maintenance})</TabsTrigger>
          ) : null}
        </TabsList>
      </Tabs>

      {loading || shopLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des emplacements…</p>
      ) : filteredLocations.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucun emplacement pour ce filtre.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {filteredLocations.map((location) => {
            const TypeIcon = TYPE_ICONS[location.location_type] ?? Box;
            const ticket = location.current_ticket_id
              ? ticketById.get(location.current_ticket_id)
              : undefined;
            const clickable = plan && location.status === "occupied" && location.current_ticket_id;
            const card = (
              <Card className="group relative h-full transition-colors hover:border-primary/40">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TypeIcon className="size-5 shrink-0 text-primary" />
                      <h2 className="truncate font-semibold">{location.name}</h2>
                    </div>
                    <Badge className={STATUS_CLASSES[location.status]}>
                      {STATUS_LABELS[location.status]}
                    </Badge>
                  </div>
                  {plan && location.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{location.description}</p>
                  ) : null}
                  {location.status === "occupied" ? (
                    <p className="text-sm text-muted-foreground">
                      {ticket?.client_name ?? "Fiche en cours"}
                    </p>
                  ) : null}
                  {!plan ? (
                    <div className="flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Modifier ${location.name}`}
                        title="Modifier"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editLocation(location);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer ${location.name}`}
                        title="Supprimer"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeletingLocation(location);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
            return clickable ? (
              <Link
                key={location.id}
                to="/phone/atelier/$id"
                params={{ id: location.current_ticket_id! }}
                className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${location.name}, occupé par ${ticket?.client_name ?? "une fiche"}`}
              >
                {card}
              </Link>
            ) : (
              <div key={location.id}>{card}</div>
            );
          })}
        </div>
      )}

      <StorageLocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shopId={shopId ?? ""}
        location={editingLocation}
        onSaved={() => void load()}
      />
      <AlertDialog open={Boolean(deletingLocation)} onOpenChange={(open) => !open && setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet emplacement ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingLocation?.name} sera supprimé définitivement de l'atelier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
