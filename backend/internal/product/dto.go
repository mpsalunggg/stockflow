package product

import (
	"net/url"
	"strconv"
	"strings"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

const (
	defaultLimit = 20
	maxLimit     = 100
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

type ListParams struct {
	Search string
	Page   int
	Limit  int
}

func (p ListParams) offset() int {
	return (p.Page - 1) * p.Limit
}

type ListResult struct {
	Data  []Product `json:"data"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
	Total int       `json:"total"`
}

func parseListParams(q url.Values) (ListParams, error) {
	params := ListParams{
		Search: strings.TrimSpace(q.Get("search")),
		Page:   1,
		Limit:  defaultLimit,
	}
	details := map[string]string{}

	if v := q.Get("page"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			details["page"] = "must be a positive integer"
		} else {
			params.Page = n
		}
	}
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > maxLimit {
			details["limit"] = "must be an integer between 1 and " + strconv.Itoa(maxLimit)
		} else {
			params.Limit = n
		}
	}

	if len(details) > 0 {
		return ListParams{}, apperrors.Validation(details)
	}
	return params, nil
}

func likePattern(search string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return "%" + r.Replace(search) + "%"
}
