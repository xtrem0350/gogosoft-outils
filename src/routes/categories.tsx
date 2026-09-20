import { createFileRoute } from "@tanstack/react-router";
import { FolderTree } from "lucide-react";

import { RoutePage } from "@/components/RoutePage";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

function CategoriesPage() {
  return (
    <RoutePage
      eyebrow="Organisation"
      title="Catégories"
      description="Explorez le catalogue par famille de matériel et de pilotes."
      icon={FolderTree}
      actionLabel="Ouvrir le catalogue"
      actionTo="/outils"
    />
  );
}
