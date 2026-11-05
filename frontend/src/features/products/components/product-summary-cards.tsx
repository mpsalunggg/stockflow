import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatRupiah } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "../constants";
import { useProductSummary } from "../hooks";

function SummaryCard({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="min-w-0 gap-1 px-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums wrap-anywhere sm:text-2xl">{children}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  );
}

export function ProductSummaryCards() {
  const { data, isPending, isError } = useProductSummary();

  const value = (render: (summary: NonNullable<typeof data>) => ReactNode) => {
    if (isPending) return <Skeleton className="mt-1 h-7 w-20" />;
    if (isError) return "—";
    return render(data);
  };

  return (
    <section aria-label="Inventory summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard label="Total Products">{value((s) => formatNumber(s.total_products))}</SummaryCard>
      <SummaryCard label="Active Products">{value((s) => formatNumber(s.active_products))}</SummaryCard>
      <SummaryCard label="Total Stock Value" hint="Price × stock">
        {value((s) => formatRupiah(s.stock_value))}
      </SummaryCard>
      <SummaryCard label="Low Stock" hint={`Stock ≤ ${LOW_STOCK_THRESHOLD}`}>
        {value((s) => formatNumber(s.low_stock_count))}
      </SummaryCard>
    </section>
  );
}
