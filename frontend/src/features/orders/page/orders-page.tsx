import { CircleAlert, Plus, RotateCw, Search, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/layout/page-header";
import { TablePagination } from "@/components/table-pagination";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTableParams } from "@/hooks/use-table-params";
import { OrdersTable } from "../components/orders-table";
import { useOrders } from "../hooks";
import { orderStatuses, type OrderStatus } from "../schemas";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "CREATED", label: "Created" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toStatus(value: string) {
  return orderStatuses.find((status) => status === value) as OrderStatus | undefined;
}

export function OrdersPage() {
  const { page, limit, search, setPage, setLimit, setSearch, getFilter, setFilter, update } =
    useTableParams();
  const status = toStatus(getFilter("status"));

  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useOrders({
    search: debouncedSearch,
    status,
    page,
    limit,
  });

  const orders = data?.data;
  const total = data?.total ?? 0;
  const isEmpty = data !== undefined && total === 0;
  const isOutOfRange = orders?.length === 0 && total > 0 && page > 1;
  const hasFilter = Boolean(debouncedSearch || status);

  useEffect(() => {
    if (isOutOfRange) setPage(Math.ceil(total / limit));
  }, [isOutOfRange, total, limit, setPage]);

  const clearFilters = () => update({ search: undefined, status: undefined });

  return (
    <>
      <PageHeader
        title="Sales Orders"
        description="Manage customer orders and track sales."
        actions={
          <Button nativeButton={false} render={<Link to="/orders/new" />}>
            <Plus />
            Create Order
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <InputGroup className="max-w-sm flex-1 basis-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search orders"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <Select
            items={statusOptions}
            value={status ?? "all"}
            onValueChange={(value) => setFilter("status", value === "all" ? undefined : value ?? undefined)}
          >
            <SelectTrigger aria-label="Filter by status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data && (
            <span aria-live="polite" className="ml-auto text-sm text-muted-foreground">
              {total} {total === 1 ? "order" : "orders"}
            </span>
          )}
        </div>

        {isError ? (
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
                <CircleAlert />
              </EmptyMedia>
              <EmptyTitle>Couldn't load orders</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => refetch()}>
                <RotateCw />
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <OrdersTable orders={orders} loading={isPending} stale={isPlaceholderData} />
        )}

        {isEmpty && (
          <Empty className="border-t py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {hasFilter ? <Search /> : <ShoppingBag />}
              </EmptyMedia>
              <EmptyTitle>{hasFilter ? "No orders found" : "No orders yet"}</EmptyTitle>
              <EmptyDescription>
                {hasFilter
                  ? "No order matches the current search or status filter."
                  : "Create the first order to start tracking sales."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasFilter ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear search and filter
                </Button>
              ) : (
                <Button nativeButton={false} render={<Link to="/orders/new" />}>
                  <Plus />
                  Create Order
                </Button>
              )}
            </EmptyContent>
          </Empty>
        )}

        {data && !isError && (
          <TablePagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </Card>
    </>
  );
}
