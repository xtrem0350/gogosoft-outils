import { createFileRoute } from "@tanstack/react-router";
import { ExperienceBookPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/phone/carnet")({
  component: () => <ExperienceBookPage activityType="phone" />,
});
