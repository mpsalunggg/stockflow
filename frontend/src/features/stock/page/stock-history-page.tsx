import { ArrowDown, ArrowUpDown, CircleAlert, History, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/features/products/hooks";
import { useTableParams } from "@/hooks/use-table-params";
import { formatNumber, formatRupiah, timeAgo } from "@/lib/format";
import { AdjustStockDialog } from "../components/adjust-stock-dialog";
import { MovementsTable } from "../components/movements-table";
import { ProductPicker } from "@/features/products/components/product-picker";
import { useMovements } from "../hooks";

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:border-l sm:px-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{children}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Empty className="py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>Couldn't load stock history</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          <RotateCw />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function StockHistoryPage() {
  const { getFilter, setFilter } = useTableParams();
  const productParam = Number(getFilter("product"));
  const productId = Number.isInteger(productParam) && productParam > 0 ? productParam : undefined;
  const [adjusting, setAdjusting] = useState(false);

  const product = useProduct(productId);
  const movements = useMovements(productId);
  const count = movements.data?.data.length ?? 0;

  return (
    <>
      <PageHeader
        title="Stock History"
        description="Choose a product to see every stock movement, newest first."
      />

      <Card className="flex-row flex-wrap items-end gap-4 px-4">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-2 sm:max-w-md">
          <Label htmlFor="history-product">Product</Label>
          <ProductPicker
            id="history-product"
            value={product.data}
            onChange={(selected) => setFilter("product", selected.id)}
          />
        </div>
        {product.isLoading && <Skeleton className="h-12 w-72" />}
        {product.data && (
          <>
            <div className="flex flex-wrap gap-4 sm:gap-0">
              <Stat label="Current Stock">{formatNumber(product.data.stock)} units</Stat>
              <Stat label="Price">{formatRupiah(product.data.price)}</Stat>
              <Stat label="Last Movement">
                {product.data.last_movement_at ? timeAgo(product.data.last_movement_at) : "None yet"}
              </Stat>
            </div>
            <Button className="sm:ml-auto" onClick={() => setAdjusting(true)}>
              <ArrowUpDown />
              Adjust Stock
            </Button>
          </>
        )}
      </Card>

      {productId === undefined ? (
        <Card>
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History />
              </EmptyMedia>
              <EmptyTitle>Choose a product</EmptyTitle>
              <EmptyDescription>
                Pick a product above to see its stock movements.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="gap-0 py-0">
          <div className="flex items-baseline justify-between gap-3 px-4 py-3.5">
            <h2 className="font-semibold">Movements</h2>
            {movements.data && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowDown className="size-3.5" />
                Newest first · {count} {count === 1 ? "movement" : "movements"}
              </span>
            )}
          </div>
          {movements.isError || product.isError ? (
            <ErrorState
              message={(movements.error ?? product.error)?.message ?? ""}
              onRetry={() => {
                product.refetch();
                movements.refetch();
              }}
            />
          ) : (
            <>
              <MovementsTable movements={movements.data?.data} loading={movements.isPending} />
              {count === 0 && movements.data && (
                <Empty className="border-t py-14">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History />
                    </EmptyMedia>
                    <EmptyTitle>No movements yet</EmptyTitle>
                    <EmptyDescription>
                      Stock changes for this product will show up here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          )}
        </Card>
      )}

      {adjusting && product.data && (
        <AdjustStockDialog product={product.data} onClose={() => setAdjusting(false)} />
      )}
    </>
  );
}
