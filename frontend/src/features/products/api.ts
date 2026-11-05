import { request } from '@/lib/api'
import { productListSchema, productSchema, type ProductForm, type ProductListParams } from './schemas'

export function listProducts({ search, page, limit }: ProductListParams) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set('search', search)
  return request(`/products?${query}`, undefined, productListSchema)
}

export function getProduct(id: number) {
  return request(`/products/${id}`, undefined, productSchema)
}

export function createProduct(input: ProductForm) {
  return request('/products', { method: 'POST', body: JSON.stringify(input) }, productSchema)
}

export function updateProduct(id: number, input: ProductForm) {
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }, productSchema)
}

export function deleteProduct(id: number) {
  return request<void>(`/products/${id}`, { method: 'DELETE' })
}
