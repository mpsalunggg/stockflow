import type { MovementType } from "./schemas";

export const movementTone = {
  in: "text-emerald-700 dark:text-emerald-400",
  out: "text-destructive",
} satisfies Record<MovementType, string>;
