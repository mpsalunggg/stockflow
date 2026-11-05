import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/features/products/hooks";
import { adjustStock, listMovements } from "./api";
import type { AdjustStockForm } from "./schemas";

export const movementKeys = {
  list: (productId: number) => ["movements", productId] as const,
};

export function useMovements(productId: number | undefined) {
  return useQuery({
    queryKey: movementKeys.list(productId ?? 0),
    queryFn: () => listMovements(productId!),
    enabled: productId !== undefined,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: number; input: AdjustStockForm }) =>
      adjustStock(productId, input),
    onSettled: (_data, _error, { productId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: movementKeys.list(productId) }),
      ]),
  });
}
