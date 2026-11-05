import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "./api";
import type { ProductForm, ProductListParams } from "./schemas";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: number) => ["products", "detail", id] as const,
};

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? 0),
    queryFn: () => getProduct(id!),
    enabled: id !== undefined,
  });
}

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: productKeys.all });
}

export function useCreateProduct() {
  const onSettled = useInvalidateProducts();
  return useMutation({ mutationFn: createProduct, onSettled });
}

export function useUpdateProduct() {
  const onSettled = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProductForm }) =>
      updateProduct(id, input),
    onSettled,
  });
}

export function useDeleteProduct() {
  const onSettled = useInvalidateProducts();
  return useMutation({ mutationFn: deleteProduct, onSettled });
}
