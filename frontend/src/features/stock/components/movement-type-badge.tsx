import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MovementType } from "../schemas";

export function MovementTypeBadge({ type }: { type: MovementType }) {
  if (type === "in") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
        <ArrowDownLeft />
        Stock In
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <ArrowUpRight />
      Stock Out
    </Badge>
  );
}
