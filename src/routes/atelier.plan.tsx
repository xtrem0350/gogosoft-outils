import { createFileRoute } from "@tanstack/react-router";

import { StorageLocationsPage } from "@/components/StorageLocationPages";

export const Route = createFileRoute("/atelier/plan")({
  component: () => <StorageLocationsPage plan />,
});
