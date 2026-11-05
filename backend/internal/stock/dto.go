package stock

import (
	"strings"
	"unicode/utf8"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

const (
	typeIn        = "in"
	typeOut       = "out"
	maxNoteLength = 500
)

type AdjustInput struct {
	Type string  `json:"type"`
	Qty  *int    `json:"qty"`
	Note *string `json:"note"`
}

func (in *AdjustInput) normalize() {
	in.Type = strings.TrimSpace(in.Type)
	if in.Note != nil {
		note := strings.TrimSpace(*in.Note)
		in.Note = &note
		if note == "" {
			in.Note = nil
		}
	}
}

func (in AdjustInput) validate() error {
	details := map[string]string{}
	if in.Type != typeIn && in.Type != typeOut {
		details["type"] = "must be one of: in, out"
	}
	if in.Qty == nil {
		details["qty"] = "is required"
	} else if *in.Qty <= 0 {
		details["qty"] = "must be greater than 0"
	}
	if in.Note != nil && utf8.RuneCountInString(*in.Note) > maxNoteLength {
		details["note"] = "must be at most 500 characters"
	}
	if len(details) > 0 {
		return apperrors.Validation(details)
	}
	return nil
}

type AdjustResult struct {
	Movement Movement `json:"movement"`
	Stock    int      `json:"stock"`
}

type MovementList struct {
	Data []Movement `json:"data"`
}
