import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProduct, deleteProduct, listProducts, updateProduct } from './api'
import type { ProductForm, ProductListParams } from './schemas'

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => ['products', params] as const,
}

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: productKeys.all })
}

export function useCreateProduct() {
  const onSuccess = useInvalidateProducts()
  return useMutation({ mutationFn: createProduct, onSuccess })
}

export function useUpdateProduct() {
  const onSuccess = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProductForm }) => updateProduct(id, input),
    onSuccess,
  })
}

export function useDeleteProduct() {
  const onSuccess = useInvalidateProducts()
  return useMutation({ mutationFn: deleteProduct, onSuccess })
}
