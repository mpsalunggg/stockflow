import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ProductPicker } from "@/features/products/components/product-picker";
import { ApiError } from "@/lib/api";
import { formatNumber, formatRupiah } from "@/lib/format";
import { useCreateOrder } from "../hooks";
import { createOrderFormSchema, type CreateOrderForm } from "../schemas";

type Insufficient = { index: number; sku: string; name: string; requested: number; available: number };

const emptyItem = { product: undefined, qty: undefined as unknown as number };

function sentence(message: string) {
  return message.charAt(0).toUpperCase() + message.slice(1) + ".";
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const saving = createOrder.isPending;
  const [insufficient, setInsufficient] = useState<Insufficient | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: { customer: "", items: [emptyItem] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const [customer, items] = useWatch({ control: form.control, name: ["customer", "items"] });

  const totalUnits = items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const productCount = items.filter((item) => item.product).length;
  const estimate = items.reduce(
    (sum, item) => sum + (item.product ? item.product.price * (item.qty || 0) : 0),
    0,
  );

  const handleError = (error: Error, values: CreateOrderForm) => {
    if (error instanceof ApiError && error.code === "INSUFFICIENT_STOCK") {
      const sku = String(error.fields.sku);
      const available = Number(error.fields.available);
      const index = values.items.findIndex((item) => item.product?.sku === sku);
      const item = values.items[index];
      setInsufficient({ index, sku, name: item?.product?.name ?? sku, requested: item?.qty ?? 0, available });
      if (index >= 0) {
        form.setError(`items.${index}.qty`, {
          message: `Only ${formatNumber(available)} units available.`,
        });
      }
      return;
    }

    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      const details = (error.fields.details ?? {}) as Record<string, string>;
      for (const [key, message] of Object.entries(details)) {
        const path = key.replace(/\.sku$/, ".product") as FieldPath<CreateOrderForm>;
        form.setError(path, { message: sentence(message) });
      }
      return;
    }

    toast.error(error.message);
  };

  const submit = form.handleSubmit((values) => {
    setInsufficient(null);
    createOrder.mutate(
      {
        idempotencyKey,
        input: {
          customer: values.customer,
          items: values.items.map((item) => ({ sku: item.product!.sku, qty: item.qty })),
        },
      },
      {
        onSuccess: (order) => {
          toast.success(`Order #${order.id} created.`);
          navigate(`/orders/${order.id}`);
        },
        onError: (error) => handleError(error, values),
      },
    );
  });

  return (
    <>
      <PageHeader
        title="Create Order"
        description="Add the customer and the products they're buying. Stock is taken out when the order is created."
      />

      {insufficient && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>The order wasn't created. Nothing was saved.</AlertTitle>
          <AlertDescription>
            <span>
              {insufficient.name} (<span className="font-mono">{insufficient.sku}</span>): requested{" "}
              {formatNumber(insufficient.requested)}, only {formatNumber(insufficient.available)}{" "}
              available. <span className="font-mono text-xs">409 INSUFFICIENT_STOCK</span>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="customer"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="order-customer">Customer Name</FieldLabel>
                    <Input
                      {...field}
                      id="order-customer"
                      placeholder="e.g. Toko Sumber Rejeki"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Each product can appear once. Unit prices are read-only, the server sets the final
                price.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fields.map((row, index) => {
                const item = items[index];
                const price = item?.product?.price;
                const isInsufficient = insufficient?.index === index;
                return (
                  <div
                    key={row.id}
                    className="grid gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_7rem_2rem] sm:items-start"
                  >
                    <Controller
                      name={`items.${index}.product`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="sm:sr-only">Product</FieldLabel>
                          <ProductPicker
                            aria-label={`Product for item ${index + 1}`}
                            value={field.value}
                            invalid={fieldState.invalid}
                            onChange={(product) => {
                              field.onChange(product);
                              if (isInsufficient) setInsufficient(null);
                            }}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.qty`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="sm:sr-only">Quantity</FieldLabel>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            inputMode="numeric"
                            placeholder="Qty"
                            aria-label={`Quantity for item ${index + 1}`}
                            aria-invalid={fieldState.invalid}
                            className="tabular-nums"
                            value={field.value === undefined ? "" : formatNumber(field.value)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              field.onChange(digits === "" ? undefined : Number(digits));
                            }}
                          />
                          <FieldError errors={[fieldState.error]} />
                          {isInsufficient && insufficient.available > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                form.setValue(`items.${index}.qty`, insufficient.available, {
                                  shouldValidate: true,
                                });
                                setInsufficient(null);
                              }}
                            >
                              Set to {formatNumber(insufficient.available)}
                            </Button>
                          )}
                        </Field>
                      )}
                    />
                    <div className="flex justify-between gap-2 text-sm sm:block sm:pt-2 sm:text-right">
                      <span className="text-muted-foreground sm:sr-only">Unit price</span>
                      <span className="tabular-nums text-muted-foreground">
                        {price === undefined ? "—" : formatRupiah(price)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-sm sm:block sm:pt-2 sm:text-right">
                      <span className="text-muted-foreground sm:sr-only">Subtotal</span>
                      <span className="font-medium tabular-nums">
                        {price === undefined ? "—" : formatRupiah(price * (item?.qty || 0))}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove item ${index + 1}`}
                      disabled={fields.length === 1}
                      onClick={() => {
                        remove(index);
                        setInsufficient(null);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => append(emptyItem)}
              >
                <Plus />
                Add another item
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Customer</span>
              <span className="truncate font-medium">{customer.trim() || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total Items</span>
              <span className="tabular-nums">
                {formatNumber(totalUnits)} units · {productCount}{" "}
                {productCount === 1 ? "product" : "products"}
              </span>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium">Grand Total</span>
              <span className="text-xl font-semibold tabular-nums">{formatRupiah(estimate)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimate from current product prices. The server calculates the final total when the
              order is created.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Spinner />}
                {saving ? "Creating..." : "Create Order"}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                disabled={saving}
                render={<Link to="/orders" />}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
