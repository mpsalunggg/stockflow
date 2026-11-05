package order

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/url"
	"strconv"
	"strings"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
	"github.com/mpsalunggg/stockflow/backend/internal/shared/request"
)

type CreateInput struct {
	Customer string      `json:"customer"`
	Items    []ItemInput `json:"items"`
}

type ItemInput struct {
	SKU string `json:"sku"`
	Qty *int   `json:"qty"`
}

func (in *CreateInput) normalize() {
	in.Customer = strings.TrimSpace(in.Customer)
	for i := range in.Items {
		in.Items[i].SKU = strings.TrimSpace(in.Items[i].SKU)
	}
}

func (in CreateInput) validate() error {
	details := map[string]string{}
	if in.Customer == "" {
		details["customer"] = "is required"
	}
	if len(in.Items) == 0 {
		details["items"] = "must contain at least one item"
	}

	seen := map[string]bool{}
	for i, item := range in.Items {
		key := itemKey(i)
		switch {
		case item.SKU == "":
			details[key+".sku"] = "is required"
		case seen[item.SKU]:
			details[key+".sku"] = "duplicate sku in this order"
		}
		seen[item.SKU] = true

		if item.Qty == nil {
			details[key+".qty"] = "is required"
		} else if *item.Qty <= 0 {
			details[key+".qty"] = "must be greater than 0"
		}
	}

	if len(details) > 0 {
		return apperrors.Validation(details)
	}
	return nil
}

const maxIdempotencyKeyLength = 255

func validateIdempotencyKey(key string) error {
	if len(key) > maxIdempotencyKeyLength {
		return apperrors.Validation(map[string]string{
			"idempotency_key": "must be at most 255 characters",
		})
	}
	return nil
}

func requestHash(in CreateInput) string {
	body, _ := json.Marshal(in)
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}

func itemKey(index int) string {
	return "items." + strconv.Itoa(index)
}

type ListParams struct {
	Search string
	Status string
	request.Pagination
}

type ListResult struct {
	Data  []Summary `json:"data"`
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
	if params.Status != "" && params.Status != statusCreated && params.Status != statusCancelled {
		details["status"] = "must be one of: CREATED, CANCELLED"
	}
	if len(details) > 0 {
		return ListParams{}, apperrors.Validation(details)
	}
	return params, nil
}
