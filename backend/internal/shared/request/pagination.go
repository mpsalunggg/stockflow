package request

import (
	"net/url"
	"strconv"
)

const (
	defaultLimit = 20
	maxLimit     = 100
)

type Pagination struct {
	Page  int
	Limit int
}

func (p Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}

func ParsePagination(q url.Values, details map[string]string) Pagination {
	page := Pagination{Page: 1, Limit: defaultLimit}

	if v := q.Get("page"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			details["page"] = "must be a positive integer"
		} else {
			page.Page = n
		}
	}
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > maxLimit {
			details["limit"] = "must be an integer between 1 and " + strconv.Itoa(maxLimit)
		} else {
			page.Limit = n
		}
	}
	return page
}
