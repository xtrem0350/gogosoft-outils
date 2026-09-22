import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createTool,
  duplicateTool,
  getTool,
  hardDeleteTool,
  listTools,
  restoreTool,
  softDeleteTool,
  toggleFavori,
  updateTool,
  type ToolFilters,
} from "@/services/toolService";
import type { Tool, ToolInsert, ToolUpdate } from "@/types/database";

/** Liste réactive des outils de la boutique courante. */
export function useTools(filters: ToolFilters = {}) {
  return useQuery({
    queryKey: ["tools", filters],
    queryFn: () => listTools(filters),
    enabled: Boolean(filters.shopId),
  });
}

/** Détail d'un outil. */
export function useTool(id: string) {
  return useQuery({
    queryKey: ["tool", id],
    queryFn: () => getTool(id),
    enabled: Boolean(id),
  });
}

/** Mutations CRUD sur les outils, avec notifications. */
export function useToolMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["tools"] });
    void qc.invalidateQueries({ queryKey: ["tool"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
    void qc.invalidateQueries({ queryKey: ["logs"] });
  };
  const onError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Action impossible.";
    toast.error(message.includes("row-level security") ? "Vos droits ne permettent pas cette action." : message);
  };

  return {
    create: useMutation({
      mutationFn: (values: Omit<ToolInsert, "created_by">) => createTool(values),
      onSuccess: () => {
        invalidate();
        toast.success("Outil ajouté.");
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: ToolUpdate }) => updateTool(id, values),
      onSuccess: () => {
        invalidate();
        toast.success("Outil mis à jour.");
      },
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => softDeleteTool(id),
      onSuccess: () => {
        invalidate();
        toast.success("Outil envoyé à la corbeille.");
      },
      onError,
    }),
    restore: useMutation({
      mutationFn: (id: string) => restoreTool(id),
      onSuccess: () => {
        invalidate();
        toast.success("Outil restauré.");
      },
      onError,
    }),
    destroy: useMutation({
      mutationFn: (id: string) => hardDeleteTool(id),
      onSuccess: () => {
        invalidate();
        toast.success("Outil supprimé définitivement.");
      },
      onError,
    }),
    duplicate: useMutation({
      mutationFn: (tool: Tool) => duplicateTool(tool),
      onSuccess: () => {
        invalidate();
        toast.success("Outil dupliqué.");
      },
      onError,
    }),
    favorite: useMutation({
      mutationFn: (tool: Tool) => toggleFavori(tool),
      onSuccess: () => invalidate(),
      onError,
    }),
  };
}
