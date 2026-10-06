import { createFileRoute } from "@tanstack/react-router";

import { PublicShopPage } from "@/components/ShopfrontPages";

export const Route = createFileRoute("/shop/$slug")({ component: ShopRoute });

function ShopRoute() {
  const { slug } = Route.useParams();
  return <PublicShopPage slug={slug} />;
}
