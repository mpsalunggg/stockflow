import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "../schemas";
import { ProductRowActions } from "./product-row-actions";
import { StockCell } from "./stock-cell";

type ProductTableProps = {
  products?: Product[];
  loading: boolean;
  stale: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const skeletonWidths = ["w-3/5", "w-1/2", "w-2/3", "w-2/5", "w-1/2"];

export function ProductTable({
  products,
  loading,
  stale,
  onEdit,
  onAdjust,
  onDelete,
}: ProductTableProps) {
  return (
    <Table aria-busy={loading}>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-36 pl-4">SKU</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-44 text-right">Stock</TableHead>
          <TableHead>Last Movement</TableHead>
          <TableHead className="w-12 pr-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={cn(stale && "opacity-60 transition-opacity")}>
        {loading &&
          skeletonWidths.map((width, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className={cn("h-3", width)} />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-3 w-5" />
              </TableCell>
            </TableRow>
          ))}
        {products?.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="pl-4">
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {product.sku}
              </span>
            </TableCell>
            <TableCell className="font-medium">
              <span className="inline-flex items-center gap-2">
                {product.name}
                {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRupiah(product.price)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <StockCell stock={product.stock} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {product.last_movement_at ? (
                timeAgo(product.last_movement_at)
              ) : (
                <span className="italic">No movements yet</span>
              )}
            </TableCell>
            <TableCell className="pr-4 text-right">
              <ProductRowActions
                product={product}
                onEdit={onEdit}
                onAdjust={onAdjust}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
