import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "../schemas";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return <Badge variant="secondary">Cancelled</Badge>;
  }
  return (
    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      Created
    </Badge>
  );
}
