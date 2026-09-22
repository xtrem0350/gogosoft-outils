import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, List, Plus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { useToolMutations, useTools } from "@/hooks/useTools";
import { CATEGORIES, TOOL_TYPES, type Categorie, type Tool, type ToolType } from "@/types/database";

export const Route = createFileRoute("/outils/")({
  head: () => ({
    meta: [
      { title: "Catalogue d'outils — GogoSoft Tools Manager" },
      {
        name: "description",
        content:
          "Gérez les utilitaires de réparation de votre atelier : versions, emplacements et lancement.",
      },
      { property: "og:title", content: "Catalogue d'outils — GogoSoft Tools Manager" },
      {
        property: "og:description",
        content: "Vos utilitaires MTK, Unisoc, Apple et pilotes, centralisés.",
      },
    ],
  }),
  component: OutilsPage,
});

interface FormState {
  nom: string;
  version: string;
  chemin: string;
  type: ToolType;
  categorie: Categorie;
  sous_categorie: string;
  description: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  nom: "",
  version: "",
  chemin: "",
  type: "exe",
  categorie: "MTK",
  sous_categorie: "",
  description: "",
  tags: "",
};

/** Catalogue des outils : recherche, filtres, création, édition et suppression. */
function OutilsPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("all");
  const [type, setType] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const filters = useMemo(
    () => ({ shopId, search, categorie, type }),
    [shopId, search, categorie, type],
  );
  const { data: tools = [], isLoading, error } = useTools(filters);
  const { create, update, remove, duplicate, favorite } = useToolMutations();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(tool: Tool) {
    setEditing(tool);
    setForm({
      nom: tool.nom,
      version: tool.version ?? "",
      chemin: tool.chemin,
      type: tool.type as ToolType,
      categorie: tool.categorie as Categorie,
      sous_categorie: tool.sous_categorie ?? "",
      description: tool.description ?? "",
      tags: (tool.tags ?? []).join(", "),
    });
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!shopId) {
      toast.error("Sélectionnez une boutique avant d'ajouter un outil.");
      return;
    }
    if (!form.nom.trim() || !form.chemin.trim()) {
      toast.error("Le nom et le chemin sont obligatoires.");
      return;
    }
    const payload = {
      shop_id: shopId,
      nom: form.nom.trim(),
      version: form.version.trim() || null,
      chemin: form.chemin.trim(),
      type: form.type,
      categorie: form.categorie,
      sous_categorie: form.sous_categorie.trim() || null,
      description: form.description.trim() || null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editing) {
      update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  }

  function handleDelete(tool: Tool) {
    if (!window.confirm(`Envoyer « ${tool.nom} » à la corbeille ?`)) return;
    remove.mutate(tool.id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Catalogue</p>
          <h1 className="mt-2 text-3xl font-bold">Outils</h1>
          <p className="mt-2 text-muted-foreground">
            Vos utilitaires, leurs versions et leurs emplacements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            aria-label="Changer de vue"
          >
            {view === "grid" ? <List /> : <LayoutGrid />}
          </Button>
          <Button onClick={openCreate}>
            <Plus />
            Ajouter un outil
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Rechercher un outil…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {TOOL_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Impossible de charger le catalogue."}
        </div>
      ) : null}

      {shopLoading || isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}

      {!shopLoading && !shopId ? (
        <EmptyState
          icon={Wrench}
          title="Aucune boutique sélectionnée"
          description="Créez ou sélectionnez une boutique pour gérer son catalogue d'outils."
        />
      ) : null}

      {shopId && !isLoading && !error && tools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Aucun outil"
          description="Ajoutez vos utilitaires de réparation pour les retrouver et les lancer rapidement."
          actionLabel="Ajouter un outil"
          onAction={openCreate}
        />
      ) : null}

      <div
        className={
          view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"
        }
      >
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            view={view}
            onEdit={openEdit}
            onDelete={handleDelete}
            onDuplicate={(item) => duplicate.mutate(item)}
            onToggleFavori={(item) => favorite.mutate(item)}
          />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'outil" : "Ajouter un outil"}</DialogTitle>
            <DialogDescription>
              Renseignez l'emplacement exact de l'outil sur votre PC.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(event) => setForm({ ...form, nom: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(event) => setForm({ ...form, version: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sous">Sous-catégorie</Label>
                <Input
                  id="sous"
                  value={form.sous_categorie}
                  onChange={(event) => setForm({ ...form, sous_categorie: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chemin">Chemin *</Label>
              <Input
                id="chemin"
                placeholder="C:\\Program Files\\MonOutil"
                value={form.chemin}
                onChange={(event) => setForm({ ...form, chemin: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as ToolType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOL_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={form.categorie}
                  onValueChange={(value) => setForm({ ...form, categorie: value as Categorie })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
