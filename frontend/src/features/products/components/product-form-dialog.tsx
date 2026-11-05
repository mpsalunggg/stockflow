import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useCreateProduct, useUpdateProduct } from "../hooks";
import { productFormSchema, type Product, type ProductForm } from "../schemas";

type ProductFormDialogProps = {
  product?: Product;
  onClose: () => void;
};

export function ProductFormDialog({ product, onClose }: ProductFormDialogProps) {
  const isEdit = Boolean(product);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const saving = createProduct.isPending || updateProduct.isPending;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      price: product?.price,
      is_active: product?.is_active ?? true,
    },
  });

  const handleError = (error: Error) => {
    if (error instanceof ApiError && error.code === "SKU_EXISTS") {
      form.setError("sku", { message: "SKU already exists. Use a different one." });
      return;
    }
    if (error instanceof ApiError && error.status === 404) {
      toast.error("Product not found. It may have been deleted, so your changes weren't saved.");
      onClose();
      return;
    }
    toast.error(error.message);
  };

  const submit = (values: ProductForm) => {
    if (product) {
      updateProduct.mutate(
        { id: product.id, input: values },
        {
          onSuccess: (saved) => {
            toast.success(`Changes to ${saved.name} saved.`);
            onClose();
          },
          onError: handleError,
        },
      );
      return;
    }

    createProduct.mutate(values, {
      onSuccess: (saved) => {
        toast.success(`${saved.name} added with 0 units.`);
        onClose();
      },
      onError: handleError,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {product ? (
                <>
                  Update details for <span className="font-mono">{product.sku}</span>.
                </>
              ) : (
                "Add a new product to your catalog."
              )}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Controller
              name="sku"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
                  <Input
                    {...field}
                    id="product-sku"
                    className="font-mono"
                    placeholder="e.g. BRS-PRM-5KG"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-name">Product Name</FieldLabel>
                  <Input
                    {...field}
                    id="product-name"
                    placeholder="e.g. Beras Premium 5 kg"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-price">Price (IDR)</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>Rp</InputGroupAddon>
                    <InputGroupInput
                      id="product-price"
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
                  </InputGroup>
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>Whole rupiah, 0 or more.</FieldDescription>
                  )}
                </Field>
              )}
            />

            <Controller
              name="is_active"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="product-active">Active</FieldLabel>
                    <FieldDescription>Inactive products stay in the catalog.</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="product-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            {product ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2.5">
                <span className="text-muted-foreground">Current stock</span>
                <span className="font-medium tabular-nums">
                  {formatNumber(product.stock)} units, change via Adjust Stock
                </span>
              </div>
            ) : (
              <div className="flex gap-2.5 rounded-lg border bg-muted/50 p-3 text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>New products start with 0 units. Use Adjust Stock to record incoming stock.</span>
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={saving}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner />}
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
