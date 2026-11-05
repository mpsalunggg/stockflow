import { z } from "zod";

export const movementTypes = ["in", "out"] as const;

export const movementSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  type: z.enum(movementTypes),
  qty: z.number(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export const movementListSchema = z.object({
  data: z.array(movementSchema),
});

export const adjustResultSchema = z.object({
  movement: movementSchema,
  stock: z.number(),
});

export const adjustStockFormSchema = z.object({
  type: z.enum(movementTypes),
  qty: z
    .number({ error: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than 0."),
  note: z.string().trim().max(500, "Note must be at most 500 characters."),
});

export type MovementType = (typeof movementTypes)[number];
export type Movement = z.infer<typeof movementSchema>;
export type AdjustResult = z.infer<typeof adjustResultSchema>;
export type AdjustStockForm = z.infer<typeof adjustStockFormSchema>;
