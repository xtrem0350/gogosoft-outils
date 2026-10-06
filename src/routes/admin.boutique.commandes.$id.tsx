import { createFileRoute } from "@tanstack/react-router";

import { OnlineOrderDetailPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique/commandes/$id")({ component: OrderRoute });

function OrderRoute() {
  const { id } = Route.useParams();
  return <OnlineOrderDetailPage orderId={id} />;
}
