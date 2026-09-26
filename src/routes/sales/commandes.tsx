import { createFileRoute } from "@tanstack/react-router";
import { SalesListPage } from "@/components/SalesPages";

export const Route = createFileRoute("/sales/commandes")({
  component: () => <SalesListPage view="orders" />,
});
