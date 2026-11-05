import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useProducts } from "@/features/products/hooks";
import type { Product } from "@/features/products/schemas";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type ProductPickerProps = {
  id?: string;
  value?: Product;
  onChange: (product: Product) => void;
};

export function ProductPicker({ id, value, onChange }: ProductPickerProps) {
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
      <ComboboxInput id={id} placeholder="Search by SKU or product name..." />
      <ComboboxContent>
        <ComboboxEmpty>{isPending ? "Loading products..." : "No products found."}</ComboboxEmpty>
        <ComboboxList>
          {(product: Product) => (
            <ComboboxItem key={product.id} value={product}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{product.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
