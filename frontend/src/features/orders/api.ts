import { request } from "@/lib/api";
import {
  orderListSchema,
  orderSchema,
  type CreateOrderInput,
  type OrderListParams,
} from "./schemas";

export function listOrders({ search, status, page, limit }: OrderListParams) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  return request(`/orders?${query}`, undefined, orderListSchema);
}

export function getOrder(id: number) {
  return request(`/orders/${id}`, undefined, orderSchema);
}

export function createOrder(input: CreateOrderInput, idempotencyKey: string) {
  return request(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Idempotency-Key": idempotencyKey },
    },
    orderSchema,
  );
}

export function cancelOrder(id: number) {
  return request(`/orders/${id}/cancel`, { method: "POST" }, orderSchema);
}
