import { createFileRoute } from "@tanstack/react-router";
import { ActivityListPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/consumable/stock/")({
  component: () => <ActivityListPage activityType="consumable" />,
});
