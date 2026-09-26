import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetailsPage } from "@/components/ActivityWorkshopPages";

export const Route = createFileRoute("/phone/atelier/$id")({ component: PhoneTicketPage });
function PhoneTicketPage() { const { id } = Route.useParams(); return <ActivityDetailsPage activityType="phone" id={id} />; }
