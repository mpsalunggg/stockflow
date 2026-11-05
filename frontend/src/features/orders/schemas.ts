import { z } from "zod";
import { productSchema } from "@/features/products/schemas";

export const orderStatuses = ["CREATED", "CANCELLED"] as const;

export const orderItemSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  qty: z.number(),
  unit_price: z.number(),
  subtotal: z.number(),
});

export const orderSchema = z.object({
  id: z.number(),
  customer: z.string(),
  status: z.enum(orderStatuses),
  total: z.number(),
  created_at: z.string(),
  cancelled_at: z.string().nullable(),
  items: z.array(orderItemSchema),
});

export const orderSummarySchema = orderSchema.omit({ items: true }).extend({
  item_count: z.number(),
});

export const orderListSchema = z.object({
  data: z.array(orderSummarySchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export const createOrderFormSchema = z.object({
  customer: z.string().trim().min(1, "Customer name is required."),
  items: z
    .array(
      z.object({
        product: productSchema.optional().refine((p) => p !== undefined, "Choose a product."),
        qty: z
          .number({ error: "Quantity is required." })
          .int("Quantity must be a whole number.")
          .positive("Quantity must be greater than 0."),
      }),
    )
    .min(1, "Add at least one item.")
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (!item.product) return;
        if (seen.has(item.product.sku)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "product"],
            message: "This product is already in the order.",
          });
        }
        seen.add(item.product.sku);
      });
    }),
});

export type OrderStatus = (typeof orderStatuses)[number];
export type Order = z.infer<typeof orderSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type OrderList = z.infer<typeof orderListSchema>;
export type CreateOrderForm = z.input<typeof createOrderFormSchema>;

export type OrderListParams = {
  search?: string;
  status?: OrderStatus;
  page: number;
  limit: number;
};

export type CreateOrderInput = {
  customer: string;
  items: { sku: string; qty: number }[];
};
