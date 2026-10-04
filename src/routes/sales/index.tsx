import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SalesListPage } from "@/components/SalesPages";

export const Route = createFileRoute("/sales/")({
  validateSearch: z.object({ activityType: z.enum(["phone", "computer"]).optional() }),
  component: SalesPage,
});
function SalesPage() {
  const { activityType } = Route.useSearch();
  return (
    <>
      <SalesListPage {...(activityType ? { activityType } : {})} />
      <p className="mt-8 text-center text-sm text-muted-foreground">Module en construction</p>
    </>
  );
}
