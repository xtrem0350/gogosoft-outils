import { createFileRoute } from "@tanstack/react-router";
import { SalesListPage } from "@/components/SalesPages";

export const Route = createFileRoute("/sales/")({ component: SalesPage });
function SalesPage() {
  return (
    <>
      <SalesListPage />
      <p className="mt-8 text-center text-sm text-muted-foreground">Module en construction</p>
    </>
  );
}
