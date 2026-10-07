import { createFileRoute } from "@tanstack/react-router";

import { PublicShopPage } from "@/components/ShopfrontPages";
import type { ProductCategory } from "@/services/shopOnlineService";

export const Route = createFileRoute("/shop/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    category:
      search["category"] === "phone" || search["category"] === "computer"
        ? search["category"]
        : undefined,
  }),
  component: ShopRoute,
});

function ShopRoute() {
  const { slug } = Route.useParams();
  const { category } = Route.useSearch();
  return <PublicShopPage slug={slug} category={category as ProductCategory | undefined} />;
}
