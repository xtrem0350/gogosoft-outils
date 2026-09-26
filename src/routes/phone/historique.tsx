import { createFileRoute } from "@tanstack/react-router";
import { ActivityHistoryPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/phone/historique")({ component: () => <ActivityHistoryPage activityType="phone" /> });
