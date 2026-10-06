import { createFileRoute } from "@tanstack/react-router";

import { OnlineProductEditorPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique/produits/$id")({ component: ProductRoute });

function ProductRoute() {
  const { id } = Route.useParams();
  return <OnlineProductEditorPage productId={id} />;
}
