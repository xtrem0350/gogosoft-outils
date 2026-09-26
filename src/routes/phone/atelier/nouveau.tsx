import { createFileRoute } from "@tanstack/react-router";
import { NewActivityPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/phone/atelier/nouveau")({
  component: () => <NewActivityPage activityType="phone" />,
});
