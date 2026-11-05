package request

import (
	"encoding/json"
	"net/http"
	"strconv"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

const maxBodyBytes = 1 << 20

func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return apperrors.BadRequest("invalid JSON body: " + err.Error())
	}
	return nil
}

func PathID(r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id < 1 {
		return 0, false
	}
	return id, true
}
