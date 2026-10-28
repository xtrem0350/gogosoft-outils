import { createFileRoute } from "@tanstack/react-router";
import { DeviceCatalogPage } from "@/components/DeviceCatalogPage";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Laptop, Pencil, Plus, Search, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddDeviceModal } from "@/components/AddDeviceModal";
import { EditDeviceModal } from "@/components/EditDeviceModal";
import { useAvailableCategories } from "@/hooks/useAvailableCategories";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";
import {
  getDeviceCatalog,
  deleteDeviceFromCatalog,
  searchDevices,
  type DeviceCatalogItem,
  type DeviceCatalogCategory,
} from "@/services/deviceCatalogService";

export const Route = createFileRoute("/catalogue")({ component: DeviceCatalogPage });

type DeviceFilter = "all" | "smartphone" | "laptop" | "tablet";

const FILTERS: Array<{ value: DeviceFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "smartphone", label: "Téléphones" },
  { value: "laptop", label: "Ordinateurs" },
  { value: "tablet", label: "Tablettes" },
];
function LegacyDeviceCatalogPage() {
  const { isOwner } = useUserRole();
  const { categories, hasPhones, hasComputers, hasTablets } = useAvailableCategories();
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<DeviceFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultCategoryOverride, setDefaultCategoryOverride] = useState<DeviceCatalogCategory>();
  const [editingDevice, setEditingDevice] = useState<DeviceCatalogItem | null>(null);
  const visibleFilters = FILTERS.filter(({ value }) =>
    value === "all" ||
    (value === "smartphone" && hasPhones) ||
    (value === "laptop" && hasComputers) ||
    (value === "tablet" && hasTablets),
  );

  useEffect(() => {
    if (filterCategory === "smartphone" && !hasPhones) setFilterCategory("all");
    if (filterCategory === "laptop" && !hasComputers) setFilterCategory("all");
    if (filterCategory === "tablet" && !hasTablets) setFilterCategory("all");
  }, [filterCategory, hasComputers, hasPhones, hasTablets]);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const next = query.trim()
        ? await searchDevices(query, categories)
        : await getDeviceCatalog(categories);
      const filtered = next.filter((device) => {
        if (filterCategory === "all") return true;
        if (filterCategory === "laptop") return device.category === "laptop" || device.category === "desktop";
        return device.category === filterCategory;
      });
      console.log("[catalogue] loaded:", filtered.length, "devices");
      setDevices(filtered);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalogue indisponible.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [categories, filterCategory, query]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  function openAdd(category?: DeviceCatalogCategory) {
    setDefaultCategoryOverride(category);
    setShowAddModal(true);
  }

  async function handleDelete(device: DeviceCatalogItem) {
    if (!window.confirm(`Supprimer ${device.brand} ${device.model} du catalogue ?`)) return;
    try {
      await deleteDeviceFromCatalog(device.id);
      toast.success("Appareil supprimé.");
      void loadDevices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer l'appareil.");
    }
  }

  const defaultCategory = defaultCategoryOverride ?? (
    filterCategory === "all" ? undefined : filterCategory
  );
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title="Catalogue appareils"
        subtitle={`${devices.length} appareil${devices.length === 1 ? "" : "s"} · Modèles disponibles pour vos fiches de réparation.`}
        icon={BookOpen}
        iconColor="orange"
        action={isOwner ? (
          <Button type="button" onClick={() => openAdd()} className="bg-ivoirien bg-ivoirien-hover shadow-3d">
            <Plus className="mr-2 size-4" /> Ajouter un appareil
          </Button>
        ) : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="group" aria-label="Filtrer le catalogue">
          {visibleFilters.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={filterCategory === value ? "default" : "outline"}
              aria-pressed={filterCategory === value}
              onClick={() => setFilterCategory(value)}
              className={filterCategory === value ? "bg-ivoirien text-white" : ""}
            >
              {label}
            </Button>
          ))}
        </div>
        <label className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher marque ou modèle"
            aria-label="Rechercher marque ou modèle"
            className="h-10 pl-9"
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Chargement du catalogue…</p> : null}
      {!loading && devices.length === 0 ? (
        <Card className="card-3d rounded-xl border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            Aucun appareil dans cette sélection.
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {devices.map((device) => (
          <Card key={device.id} className="card-3d relative overflow-hidden rounded-xl border-0 p-2 shadow-3d">
            <CardContent className="space-y-2 p-0">
              <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                {device.image_url ? (
                  <img src={device.image_url} alt={`${device.brand} ${device.model}`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-2xl font-bold text-slate-500">{device.brand.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
                {isOwner ? (
                  <div className="absolute right-1 top-1 z-10 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full bg-white/90 p-1 shadow-sm hover:bg-orange-100 dark:bg-slate-800/90"
                      aria-label={`Modifier ${device.brand} ${device.model}`}
                      title="Éditer"
                      onClick={() => setEditingDevice(device)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full bg-white/90 p-1 text-red-500 shadow-sm hover:bg-red-100 hover:text-red-600 dark:bg-slate-800/90 dark:hover:bg-red-950"
                      aria-label={`Supprimer ${device.brand} ${device.model}`}
                      title="Supprimer"
                      onClick={() => void handleDelete(device)}
                    >
                      <Trash2 className="size-3 text-red-500" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                {device.category === "laptop" || device.category === "desktop"
                  ? <Laptop className="size-3.5 shrink-0 text-orange-700" />
                  : <Smartphone className="size-3.5 shrink-0 text-orange-700" />}
                <p className="truncate text-sm font-medium">{device.brand}</p>
              </div>
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">{device.model}</p>
              {device.os ? <p className="truncate text-xs text-muted-foreground">{device.os}</p> : null}
              {device.release_year ? <p className="text-xs text-muted-foreground">{device.release_year}</p> : null}
              {isOwner ? (
                <Button type="button" variant="outline" size="sm" className="h-7 w-full px-2 text-xs" onClick={() => openAdd(device.category)}>
                  <Plus className="size-3" /> Ajouter similaire
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <AddDeviceModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setDefaultCategoryOverride(undefined);
        }}
        {...(defaultCategory ? { defaultCategory } : {})}
        allowedCategories={categories}
        onSuccess={() => {
          setShowAddModal(false);
          setDefaultCategoryOverride(undefined);
          void loadDevices();
        }}
      />
      {editingDevice ? (
        <EditDeviceModal
          device={editingDevice}
          open={Boolean(editingDevice)}
          onClose={() => setEditingDevice(null)}
          onSuccess={() => {
            setEditingDevice(null);
            void loadDevices();
          }}
        />
      ) : null}
    </div>
  );
}
