import { createFileRoute } from "@tanstack/react-router";
import { ExperienceBookPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/computer/carnet")({ component: () => <ExperienceBookPage activityType="computer" /> });
