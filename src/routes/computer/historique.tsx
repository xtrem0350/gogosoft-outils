import { createFileRoute } from "@tanstack/react-router";
import { ActivityHistoryPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/computer/historique")({
  component: () => <ActivityHistoryPage activityType="computer" />,
});
