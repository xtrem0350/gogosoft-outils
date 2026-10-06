import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicOrderConfirmationPage } from "@/components/ShopfrontPages";

export const Route = createFileRoute("/shop/$slug/confirmation/$orderId")({
  validateSearch: z.object({ token: z.string().uuid() }),
  component: ConfirmationRoute,
});

function ConfirmationRoute() {
  const { slug, orderId } = Route.useParams();
  const { token } = Route.useSearch();
  return <PublicOrderConfirmationPage slug={slug} orderId={orderId} token={token} />;
}
