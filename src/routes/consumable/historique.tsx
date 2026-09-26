import { createFileRoute } from "@tanstack/react-router";
import { ActivityHistoryPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/consumable/historique")({ component: () => <ActivityHistoryPage activityType="consumable" /> });
