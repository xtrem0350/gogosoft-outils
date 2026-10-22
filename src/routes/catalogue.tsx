import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Laptop, Plus, Search, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AddDeviceModal } from "@/components/AddDeviceModal";
import { useAvailableCategories } from "@/hooks/useAvailableCategories";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getDeviceCatalog,
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
export function DeviceCatalogPage() {
  const { categories, hasPhones, hasComputers, hasTablets } = useAvailableCategories();
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<DeviceFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultCategoryOverride, setDefaultCategoryOverride] = useState<DeviceCatalogCategory>();
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
        action={(
          <Button type="button" onClick={() => openAdd()} className="bg-ivoirien bg-ivoirien-hover shadow-3d">
            <Plus className="mr-2 size-4" /> Ajouter un appareil
          </Button>
        )}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id} className="card-3d overflow-hidden rounded-xl border-0 shadow-3d">
            <div className="aspect-[16/9] bg-slate-100">
              {device.image_url ? (
                <img src={device.image_url} alt={`${device.brand} ${device.model}`} className="size-full object-cover" loading="lazy" />
              ) : (
                <div className="grid size-full place-items-center bg-gradient-to-br from-orange-50 via-white to-green-50 text-orange-800">
                  <span className="flex size-16 items-center justify-center rounded-full bg-white text-2xl font-bold shadow-sm">
                    {device.brand.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                {device.category === "laptop" || device.category === "desktop"
                  ? <Laptop className="mt-1 size-4 shrink-0 text-orange-700" />
                  : <Smartphone className="mt-1 size-4 shrink-0 text-orange-700" />}
                <div className="min-w-0">
                  <p className="font-bold">{device.brand}</p>
                  <p className="truncate text-sm text-slate-700">{device.model}</p>
                  {device.os ? <p className="mt-1 text-xs text-muted-foreground">{device.os}</p> : null}
                  {device.release_year ? <p className="text-xs text-muted-foreground">{device.release_year}</p> : null}
                  {Object.keys(device.specs).length > 0 ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {Object.entries(device.specs).slice(0, 2).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => openAdd(device.category)}>
                <Plus className="size-4" /> Ajouter un appareil similaire
              </Button>
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
        defaultCategory={defaultCategory}
        allowedCategories={categories}
        onSuccess={() => {
          setShowAddModal(false);
          setDefaultCategoryOverride(undefined);
          void loadDevices();
        }}
      />
    </div>
  );
}
