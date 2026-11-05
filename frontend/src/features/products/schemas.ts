import { z } from "zod";

export const productSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  last_movement_at: z.string().nullable().optional(),
});

export const productListSchema = z.object({
  data: z.array(productSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required."),
  name: z.string().trim().min(1, "Product name is required."),
  price: z
    .number({ error: "Price is required. Use whole rupiah, 0 or more." })
    .int("Price must be a whole number.")
    .min(0, "Price must be 0 or more."),
  is_active: z.boolean(),
});

export type Product = z.infer<typeof productSchema>;
export type ProductList = z.infer<typeof productListSchema>;
export type ProductForm = z.infer<typeof productFormSchema>;

export type ProductListParams = {
  search?: string;
  page: number;
  limit: number;
};
