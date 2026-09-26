import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetailsPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/computer/atelier/$id")({ component: ComputerTicketPage });
function ComputerTicketPage() { const { id } = Route.useParams(); return <ActivityDetailsPage activityType="computer" id={id} />; }
