import { createFileRoute } from "@tanstack/react-router";

import { OnlineProductsPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique/produits")({ component: OnlineProductsPage });
