package product

import (
	"net/url"
	"strings"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
	"github.com/mpsalunggg/stockflow/backend/internal/shared/request"
)

type ProductInput struct {
	SKU      string `json:"sku"`
	Name     string `json:"name"`
	Price    *int   `json:"price"`
	IsActive *bool  `json:"is_active"`
}

func (in *ProductInput) normalize() {
	in.SKU = strings.TrimSpace(in.SKU)
	in.Name = strings.TrimSpace(in.Name)
}

func (in ProductInput) validate(requireIsActive bool) error {
	details := map[string]string{}
	if in.SKU == "" {
		details["sku"] = "is required"
	}
	if in.Name == "" {
		details["name"] = "is required"
	}
	if in.Price == nil {
		details["price"] = "is required"
	} else if *in.Price < 0 {
		details["price"] = "must be greater than or equal to 0"
	}
	if requireIsActive && in.IsActive == nil {
		details["is_active"] = "is required"
	}
	if len(details) > 0 {
		return apperrors.Validation(details)
	}
	return nil
}

const (
	statusActive      = "active"
	statusInactive    = "inactive"
	statusLow         = "low"
	lowStockThreshold = 10
)

type ListParams struct {
	Search string
	Status string
	request.Pagination
}

type ListResult struct {
	Data  []Product `json:"data"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
	Total int       `json:"total"`
}

func parseListParams(q url.Values) (ListParams, error) {
	details := map[string]string{}
	params := ListParams{
		Search:     strings.TrimSpace(q.Get("search")),
		Status:     strings.TrimSpace(q.Get("status")),
		Pagination: request.ParsePagination(q, details),
	}
	switch params.Status {
	case "", statusActive, statusInactive, statusLow:
	default:
		details["status"] = "must be one of: active, inactive, low"
	}
	if len(details) > 0 {
		return ListParams{}, apperrors.Validation(details)
	}
	return params, nil
}
