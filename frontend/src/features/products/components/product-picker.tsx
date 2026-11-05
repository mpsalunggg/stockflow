import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatNumber } from "@/lib/format";
import { useProducts } from "../hooks";
import type { Product } from "../schemas";

type ProductPickerProps = {
  id?: string;
  value?: Product;
  invalid?: boolean;
  "aria-label"?: string;
  onChange: (product: Product) => void;
};

export function ProductPicker({
  id,
  value,
  invalid,
  "aria-label": ariaLabel,
  onChange,
}: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const search = useDebouncedValue(query.trim());
  const isSelectedLabel = value !== undefined && search === value.name;
  const { data, isPending } = useProducts({
    search: isSelectedLabel ? undefined : search,
    page: 1,
    limit: 20,
  });

  return (
    <Combobox
      items={data?.data ?? []}
      value={value ?? null}
      onValueChange={(product) => product && onChange(product)}
      onInputValueChange={setQuery}
      itemToStringLabel={(product) => product.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={null}
    >
      <ComboboxInput
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        placeholder="Search by SKU or product name..."
      />
      <ComboboxContent>
        <ComboboxEmpty>{isPending ? "Loading products..." : "No products found."}</ComboboxEmpty>
        <ComboboxList>
          {(product: Product) => (
            <ComboboxItem key={product.id} value={product}>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{product.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatNumber(product.stock)} in stock
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
