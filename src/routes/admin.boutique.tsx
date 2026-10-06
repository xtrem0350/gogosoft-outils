import { createFileRoute } from "@tanstack/react-router";

import { OnlineShopSettingsPage } from "@/components/ShopAdminPages";

export const Route = createFileRoute("/admin/boutique")({ component: OnlineShopSettingsPage });
