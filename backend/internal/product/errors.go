package product

import (
	"github.com/mpsalunggg/stockflow/backend/internal/database"
	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

func productNotFound() error {
	return apperrors.NotFound("product not found")
}

func mapPgError(err error, sku string) error {
	switch {
	case database.IsUniqueViolation(err):
		return apperrors.Conflict("SKU_EXISTS", map[string]any{"sku": sku})
	case database.IsForeignKeyViolation(err):
		return apperrors.Conflict("PRODUCT_HAS_HISTORY", nil)
	}
	return err
}
