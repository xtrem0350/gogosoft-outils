import { createFileRoute } from "@tanstack/react-router";

import { PublicCartPage } from "@/components/ShopfrontPages";

export const Route = createFileRoute("/shop/$slug/panier")({ component: CartRoute });

function CartRoute() {
  const { slug } = Route.useParams();
  return <PublicCartPage slug={slug} />;
}
