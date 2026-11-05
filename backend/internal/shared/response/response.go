package response

import (
	"encoding/json"
	"log/slog"
	"maps"
	"net/http"

	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encode response", "err", err)
	}
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func Error(w http.ResponseWriter, err error) {
	appErr, ok := apperrors.From(err)
	if !ok {
		slog.Error("unhandled error", "err", err)
		appErr = apperrors.Internal()
	}

	body := map[string]any{"code": appErr.Code}
	if appErr.Message != "" {
		body["message"] = appErr.Message
	}
	maps.Copy(body, appErr.Fields)

	JSON(w, appErr.Status, map[string]any{"error": body})
}
