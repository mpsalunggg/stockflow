package stock

import apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"

func productNotFound() error {
	return apperrors.NotFound("product not found")
}

func insufficientStock(sku string, available int) error {
	return apperrors.Conflict("INSUFFICIENT_STOCK", map[string]any{
		"sku":       sku,
		"available": available,
	})
}
