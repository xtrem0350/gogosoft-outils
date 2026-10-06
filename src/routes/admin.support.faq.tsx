import { createFileRoute } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";

import { AdminInfoPage } from "@/components/AdminInfoPage";

export const Route = createFileRoute("/admin/support/faq")({ component: () => <AdminInfoPage title="FAQ support" description="Les réponses partagées sont disponibles dans le centre d'aide de la plateforme." icon={CircleHelp} destination="/aide" action="Ouvrir le centre d'aide" /> });