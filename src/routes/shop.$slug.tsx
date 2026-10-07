import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicShopPage } from "@/components/ShopfrontPages";
import type { ProductCategory } from "@/services/shopOnlineService";

export const Route = createFileRoute("/shop/$slug")({
  validateSearch: z.object({ category: z.enum(["phone", "computer"]).optional() }),
  component: ShopRoute,
});

function ShopRoute() {
  const { slug } = Route.useParams();
  const { category } = Route.useSearch();
  return <PublicShopPage slug={slug} category={category as ProductCategory | undefined} />;
}
