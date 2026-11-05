import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "../constants";

export function StockCell({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge variant="destructive">Out of stock</Badge>
        <span className="font-semibold text-destructive">0</span>
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          Low
        </Badge>
        <span className="font-semibold text-amber-700 dark:text-amber-400">
          {formatNumber(stock)}
        </span>
        <span className="text-muted-foreground">units</span>
      </span>
    );
  }

  return (
    <span>
      <span className="font-medium">{formatNumber(stock)}</span>{" "}
      <span className="text-muted-foreground">units</span>
    </span>
  );
}
