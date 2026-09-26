import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetailsPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/consumable/stock/$id")({ component: ConsumablePage });
function ConsumablePage() {
  const { id } = Route.useParams();
  return <ActivityDetailsPage activityType="consumable" id={id} />;
}
