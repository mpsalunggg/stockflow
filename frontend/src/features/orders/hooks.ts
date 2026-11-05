import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { productKeys } from "@/features/products/hooks";
import { cancelOrder, createOrder, getOrder, listOrders } from "./api";
import type { OrderListParams } from "./schemas";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => ["orders", "list", params] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => getOrder(id!),
    enabled: id !== undefined,
    retry: false,
  });
}

function useInvalidateStock() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: orderKeys.all }),
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["movements"] }),
    ]);
}

export function useCreateOrder() {
  const onSettled = useInvalidateStock();
  return useMutation({ mutationFn: createOrder, onSettled });
}

export function useCancelOrder() {
  const onSettled = useInvalidateStock();
  return useMutation({ mutationFn: cancelOrder, onSettled });
}
