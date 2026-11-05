import { CircleAlert, Package, Plus, RotateCw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { AdjustStockDialog } from "@/features/stock/components/adjust-stock-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTableParams } from "@/hooks/use-table-params";
import { DeleteProductDialog } from "../components/delete-product-dialog";
import { ProductFormDialog } from "../components/product-form-dialog";
import { ProductSummaryCards } from "../components/product-summary-cards";
import { ProductTable } from "../components/product-table";
import { useProducts } from "../hooks";
import { productStatusFilters, type Product, type ProductStatusFilter } from "../schemas";

const statusOptions = [
  { value: "all", label: "All products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "low", label: "Low stock (≤ 10)" },
];

function toStatus(value: string) {
  return productStatusFilters.find((status) => status === value) as ProductStatusFilter | undefined;
}

type DialogState =
  | { type: "form"; product?: Product }
  | { type: "delete"; product: Product }
  | { type: "adjust"; product: Product }
  | null;

export function ProductsPage() {
  const { page, limit, search, setPage, setLimit, setSearch, getFilter, setFilter, update } =
    useTableParams();
  const status = toStatus(getFilter("status"));
  const [dialog, setDialog] = useState<DialogState>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isPending, isError, error, isPlaceholderData, refetch } =
    useProducts({ search: debouncedSearch, status, page, limit });

  const products = data?.data;
  const total = data?.total ?? 0;
  const isEmpty = data !== undefined && total === 0;
  const hasFilter = Boolean(debouncedSearch || status);
  const isOutOfRange = products?.length === 0 && total > 0 && page > 1;

  useEffect(() => {
    if (isOutOfRange) setPage(Math.ceil(total / limit));
  }, [isOutOfRange, total, limit, setPage]);

  const openAdd = () => setDialog({ type: "form" });
  const closeDialog = () => setDialog(null);

  const handleDeleted = () => {
    if (products?.length === 1 && page > 1) setPage(page - 1);
    closeDialog();
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your inventory and product catalog."
        actions={
          <Button onClick={openAdd}>
            <Plus />
            Add Product
          </Button>
        }
      />

      <ProductSummaryCards />

      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <InputGroup className="max-w-sm flex-1 basis-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search products"
              placeholder="Search by SKU or product name..."
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
            <SelectTrigger aria-label="Filter products" className="w-44">
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
              {total} {total === 1 ? "product" : "products"}
            </span>
          )}
        </div>

        {isError ? (
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
                <CircleAlert />
              </EmptyMedia>
              <EmptyTitle>Couldn't load products</EmptyTitle>
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
          <ProductTable
            products={products}
            loading={isPending}
            stale={isPlaceholderData}
            onEdit={(product) => setDialog({ type: "form", product })}
            onAdjust={(product) => setDialog({ type: "adjust", product })}
            onDelete={(product) => setDialog({ type: "delete", product })}
          />
        )}

        {isEmpty &&
          (hasFilter ? (
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No products found</EmptyTitle>
                <EmptyDescription>
                  No product matches the current search or filter.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => update({ search: undefined, status: undefined })}
                >
                  Clear search and filter
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>No products yet</EmptyTitle>
                <EmptyDescription>
                  Add your first product, then record incoming stock with Adjust Stock.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openAdd}>
                  <Plus />
                  Add Product
                </Button>
              </EmptyContent>
            </Empty>
          ))}

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

      {dialog?.type === "form" && (
        <ProductFormDialog product={dialog.product} onClose={closeDialog} />
      )}
      {dialog?.type === "adjust" && (
        <AdjustStockDialog product={dialog.product} onClose={closeDialog} />
      )}
      {dialog?.type === "delete" && (
        <DeleteProductDialog
          product={dialog.product}
          onClose={closeDialog}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
