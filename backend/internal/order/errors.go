package order

import apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"

func orderNotFound() error {
	return apperrors.NotFound("order not found")
}

func insufficientStock(sku string, available int) error {
	return apperrors.Conflict("INSUFFICIENT_STOCK", map[string]any{
		"sku":       sku,
		"available": available,
	})
}

func idempotencyKeyReused() error {
	return apperrors.Conflict("IDEMPOTENCY_KEY_REUSED", map[string]any{
		"message": "this Idempotency-Key was already used with a different request body",
	})
}

func alreadyCancelled() error {
	return apperrors.Conflict("ORDER_ALREADY_CANCELLED", nil)
}
