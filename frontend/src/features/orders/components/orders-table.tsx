import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, formatRupiah, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderSummary } from "../schemas";
import { OrderStatusBadge } from "./order-status-badge";

type OrdersTableProps = {
  orders?: OrderSummary[];
  loading: boolean;
  stale: boolean;
};

export function OrdersTable({ orders, loading, stale }: OrdersTableProps) {
  return (
    <Table aria-busy={loading}>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-28 pl-4">Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Total Items</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="pr-4">Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={cn(stale && "opacity-60 transition-opacity")}>
        {loading &&
          Array.from({ length: 5 }, (_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <Skeleton className="h-3 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-3 w-24" />
              </TableCell>
            </TableRow>
          ))}
        {orders?.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="pl-4">
              <Link
                to={`/orders/${order.id}`}
                className="font-mono font-medium underline-offset-4 hover:underline"
              >
                #{order.id}
              </Link>
            </TableCell>
            <TableCell className="font-medium">{order.customer}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(order.item_count)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRupiah(order.total)}
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="pr-4">
              <div className="flex flex-col">
                <span>{formatDate(order.created_at)}</span>
                <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
