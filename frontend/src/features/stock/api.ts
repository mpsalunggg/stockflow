import { request } from "@/lib/api";
import { adjustResultSchema, movementListSchema, type AdjustStockForm } from "./schemas";

export function adjustStock(productId: number, input: AdjustStockForm) {
  return request(
    `/products/${productId}/stock`,
    {
      method: "POST",
      body: JSON.stringify({ ...input, note: input.note || undefined }),
    },
    adjustResultSchema,
  );
}

export function listMovements(productId: number) {
  return request(`/products/${productId}/movements`, undefined, movementListSchema);
}
