import { createFileRoute } from "@tanstack/react-router";

import { OnlineOrdersPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique/commandes")({ component: OnlineOrdersPage });
