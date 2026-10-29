import { createFileRoute } from "@tanstack/react-router";

import { DeviceCatalogPage } from "@/components/DeviceCatalogPage";

export const Route = createFileRoute("/catalogue")({
  component: DeviceCatalogPage,
});
