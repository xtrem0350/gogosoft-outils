import { createFileRoute } from "@tanstack/react-router";
import { NewActivityPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/computer/atelier/nouveau")({
  component: () => <NewActivityPage activityType="computer" />,
});
