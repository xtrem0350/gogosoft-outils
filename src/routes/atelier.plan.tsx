import { createFileRoute } from "@tanstack/react-router";

import { RoleAssignmentPlanPage } from "@/components/RoleAssignmentPlanPage";

export const Route = createFileRoute("/atelier/plan")({
  component: RoleAssignmentPlanPage,
});
