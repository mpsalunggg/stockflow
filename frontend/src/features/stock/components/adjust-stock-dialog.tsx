import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownLeft, ArrowUpRight, CircleAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LOW_STOCK_THRESHOLD } from "@/features/products/constants";
import type { Product } from "@/features/products/schemas";
import { ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAdjustStock } from "../hooks";
import { adjustStockFormSchema, type AdjustStockForm, type MovementType } from "../schemas";

type Insufficient = { sku: string; requested: number; available: number };

type AdjustStockDialogProps = {
  product: Product;
  onClose: () => void;
};

export function AdjustStockDialog({ product, onClose }: AdjustStockDialogProps) {
  const adjustStock = useAdjustStock();
  const saving = adjustStock.isPending;
  const [currentStock, setCurrentStock] = useState(product.stock);
  const [insufficient, setInsufficient] = useState<Insufficient | null>(null);

  const form = useForm<AdjustStockForm>({
    resolver: zodResolver(adjustStockFormSchema),
    defaultValues: { type: "in", qty: undefined, note: "" },
  });
  const [type, qty] = useWatch({ control: form.control, name: ["type", "qty"] });

  const delta = qty ? (type === "in" ? qty : -qty) : 0;
  const nextStock = currentStock + delta;
  const overdraw = nextStock < 0;
  const becomesLow = qty > 0 && !overdraw && nextStock <= LOW_STOCK_THRESHOLD && nextStock < currentStock;

  const submit = (values: AdjustStockForm) => {
    setInsufficient(null);
    adjustStock.mutate(
      { productId: product.id, input: values },
      {
        onSuccess: (result) => {
          toast.success(`Stock updated. ${product.name} now has ${formatNumber(result.stock)} units.`);
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "INSUFFICIENT_STOCK") {
            const available = Number(error.fields.available);
            setCurrentStock(available);
            setInsufficient({ sku: String(error.fields.sku ?? product.sku), requested: values.qty, available });
            form.setError("qty", { message: `Only ${formatNumber(available)} units available.` });
            return;
          }
          if (error instanceof ApiError && error.status === 404) {
            toast.error("Product not found. It may have been deleted.");
            onClose();
            return;
          }
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Record an incoming or outgoing stock movement.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-medium">{product.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground">Current stock</span>
              <span className="font-semibold tabular-nums">{formatNumber(currentStock)} units</span>
            </div>
          </div>

          <FieldGroup className="gap-4">
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel id="movement-type-label">Movement Type</FieldLabel>
                  <ToggleGroup
                    aria-labelledby="movement-type-label"
                    variant="outline"
                    className="w-full"
                    value={[field.value]}
                    onValueChange={(value) => {
                      const next = value[0] as MovementType | undefined;
                      if (next) field.onChange(next);
                    }}
                  >
                    <ToggleGroupItem
                      value="in"
                      className="h-10 flex-1 data-pressed:border-emerald-600 data-pressed:bg-emerald-50 data-pressed:text-emerald-700 dark:data-pressed:bg-emerald-500/15 dark:data-pressed:text-emerald-400"
                    >
                      <ArrowDownLeft />
                      Stock In
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="out"
                      className="h-10 flex-1 data-pressed:border-destructive data-pressed:bg-destructive/10 data-pressed:text-destructive"
                    >
                      <ArrowUpRight />
                      Stock Out
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              )}
            />

            <Controller
              name="qty"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="adjust-qty">Quantity</FieldLabel>
                  <Input
                    id="adjust-qty"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    inputMode="numeric"
                    placeholder="0"
                    className="tabular-nums"
                    aria-invalid={fieldState.invalid}
                    value={field.value === undefined ? "" : formatNumber(field.value)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      field.onChange(digits === "" ? undefined : Number(digits));
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="adjust-note">
                    Note <span className="font-normal text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="adjust-note"
                    rows={2}
                    placeholder="e.g. Supplier delivery PO-2026-311"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <dl className="grid grid-cols-3 divide-x rounded-lg border">
            <div className="flex flex-col gap-1 px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Current Stock</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatNumber(currentStock)}</dd>
            </div>
            <div className="flex flex-col gap-1 px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Adjustment</dt>
              <dd
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  delta > 0 && "text-emerald-700 dark:text-emerald-400",
                  delta < 0 && "text-destructive",
                )}
              >
                {delta > 0 ? "+" : delta < 0 ? "−" : ""}
                {formatNumber(Math.abs(delta))}
              </dd>
            </div>
            <div
              className={cn(
                "flex flex-col gap-1 rounded-r-lg px-3.5 py-3",
                overdraw && "bg-destructive/10",
                becomesLow && "bg-amber-50 dark:bg-amber-500/15",
              )}
            >
              <dt className="text-xs text-muted-foreground">New Stock</dt>
              <dd
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  overdraw && "text-destructive",
                  becomesLow && "text-amber-700 dark:text-amber-400",
                )}
              >
                {overdraw ? "—" : formatNumber(nextStock)}
              </dd>
            </div>
          </dl>

          {insufficient && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>
                Insufficient stock. Only {formatNumber(insufficient.available)} units are currently available.
              </AlertTitle>
              <AlertDescription>
                <span>
                  SKU <span className="font-mono">{insufficient.sku}</span> · requested{" "}
                  {formatNumber(insufficient.requested)} units ·{" "}
                  <span className="font-mono text-xs">409 INSUFFICIENT_STOCK</span>
                </span>
              </AlertDescription>
            </Alert>
          )}

          {becomesLow && !insufficient && (
            <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4" />
              This will put the product in low stock.
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={saving}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner />}
              {saving ? "Saving..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
