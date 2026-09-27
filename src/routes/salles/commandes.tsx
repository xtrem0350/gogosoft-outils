import { createFileRoute } from "@tanstack/react-router";
import { SalesListPage } from "@/components/SalesPages";

export const Route = createFileRoute("/salles/commandes")({
  component: () => <SalesListPage view="orders" />,
});
