import { createFileRoute } from "@tanstack/react-router";
import { NewActivityPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/consumable/stock/nouveau")({ component: () => <NewActivityPage activityType="consumable" /> });
