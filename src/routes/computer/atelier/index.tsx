import { createFileRoute } from "@tanstack/react-router";
import { ActivityListPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/computer/atelier/")({
  component: () => <ActivityListPage activityType="computer" />,
});
