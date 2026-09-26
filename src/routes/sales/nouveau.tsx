import { createFileRoute } from "@tanstack/react-router";
import { NewSalePage } from "@/components/SalesPages";

export const Route = createFileRoute("/sales/nouveau")({ component: NewSalePage });
