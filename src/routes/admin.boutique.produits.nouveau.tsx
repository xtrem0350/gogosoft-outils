import { createFileRoute } from "@tanstack/react-router";

import { OnlineProductEditorPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique/produits/nouveau")({
  component: () => <OnlineProductEditorPage />,
});
