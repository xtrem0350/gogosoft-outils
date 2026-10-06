import { createFileRoute } from "@tanstack/react-router";

import { PublicProductPage } from "@/components/ShopfrontPages";

export const Route = createFileRoute("/shop/$slug/produit/$id")({ component: ProductRoute });

function ProductRoute() {
  const { slug, id } = Route.useParams();
  return <PublicProductPage slug={slug} productId={id} />;
}
