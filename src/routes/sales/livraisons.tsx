import { createFileRoute } from "@tanstack/react-router";
import { SalesListPage } from "@/components/SalesPages";

export const Route = createFileRoute("/sales/livraisons")({ component: () => <SalesListPage view="deliveries" /> });
