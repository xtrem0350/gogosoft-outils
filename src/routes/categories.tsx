import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

function CategoriesPage() {
  return <div className="p-6"><p className="text-sm font-medium text-primary">Organisation</p><h1 className="mt-2 text-3xl font-bold">Catégories</h1><p className="mt-2 text-muted-foreground">Explorez le catalogue par famille de matériel et de pilotes.</p></div>;
}
