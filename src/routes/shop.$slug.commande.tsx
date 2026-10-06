import { createFileRoute } from "@tanstack/react-router";

import { PublicCheckoutPage } from "@/components/ShopfrontPages";

export const Route = createFileRoute("/shop/$slug/commande")({ component: CheckoutRoute });

function CheckoutRoute() {
  const { slug } = Route.useParams();
  return <PublicCheckoutPage slug={slug} />;
}
