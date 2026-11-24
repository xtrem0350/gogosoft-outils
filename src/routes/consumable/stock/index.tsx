import { createFileRoute } from "@tanstack/react-router";
import { ActivityListPage } from "@/components/ActivityWorkshopPages";
import { StockItemsManager } from "@/routes/magasin";

export const Route = createFileRoute("/consumable/stock/")({
  component: () => (
    <>
      <StockItemsManager />
      <ActivityListPage activityType="consumable" />
    </>
  ),
});
