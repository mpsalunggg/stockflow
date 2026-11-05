import { ArrowLeft, Ban, CircleAlert, RotateCw, SearchX } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { formatDate, formatNumber, formatRupiah, formatTime } from "@/lib/format";
import { CancelOrderDialog } from "../components/cancel-order-dialog";
import { OrderStatusBadge } from "../components/order-status-badge";
import { useOrder } from "../hooks";

function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function OrderDetailPage() {
  const params = useParams();
  const idParam = Number(params.id);
  const id = Number.isInteger(idParam) && idParam > 0 ? idParam : undefined;
  const { data: order, isPending, isError, error, refetch } = useOrder(id);
  const [cancelling, setCancelling] = useState(false);

  const notFound = id === undefined || (error instanceof ApiError && error.status === 404);

  if (notFound) {
    return (
      <Card>
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Order not found</EmptyTitle>
            <EmptyDescription>This order doesn't exist or the link is wrong.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} render={<Link to="/orders" />}>
              <ArrowLeft />
              Back to Sales Orders
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
              <CircleAlert />
            </EmptyMedia>
            <EmptyTitle>Couldn't load this order</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => refetch()}>
              <RotateCw />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const units = order.items.reduce((sum, item) => sum + item.qty, 0);
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-medium tracking-tight">Order #{order.id}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customer} · Created {formatDateTime(order.created_at)}
          </p>
        </div>
        {!isCancelled && (
          <Button variant="destructive" onClick={() => setCancelling(true)}>
            <Ban />
            Cancel Order
          </Button>
        )}
      </div>

      {isCancelled && order.cancelled_at && (
        <Alert>
          <Ban />
          <AlertTitle>This order was cancelled on {formatDateTime(order.cancelled_at)}</AlertTitle>
          <AlertDescription>All {formatNumber(units)} units were returned to stock.</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
        <Card className="min-w-0 gap-0 py-0">
          <CardHeader className="py-4">
            <CardTitle>Ordered Products</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-4">SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="pr-4 text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(item.qty)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(item.unit_price)}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{formatRupiah(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="pl-4">
                  Total Items
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(units)}</TableCell>
                <TableCell className="text-right">Total Amount</TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">
                  {formatRupiah(order.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Order ID</dt>
              <dd className="text-right font-mono">#{order.id}</dd>
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="text-right font-medium">{order.customer}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right">
                <OrderStatusBadge status={order.status} />
              </dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-right">{formatDateTime(order.created_at)}</dd>
              {order.cancelled_at && (
                <>
                  <dt className="text-muted-foreground">Cancelled</dt>
                  <dd className="text-right">{formatDateTime(order.cancelled_at)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Total</dt>
              <dd className="text-right font-semibold tabular-nums">{formatRupiah(order.total)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {cancelling && (
        <CancelOrderDialog order={order} units={units} onClose={() => setCancelling(false)} />
      )}
    </>
  );
}
