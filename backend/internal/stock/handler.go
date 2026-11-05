package stock

import (
	"net/http"

	"github.com/mpsalunggg/stockflow/backend/internal/shared/request"
	"github.com/mpsalunggg/stockflow/backend/internal/shared/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/products/{id}/stock", h.adjust)
	mux.HandleFunc("GET /api/products/{id}/movements", h.movements)
}

func (h *Handler) adjust(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, productNotFound())
		return
	}
	var in AdjustInput
	if err := request.DecodeJSON(w, r, &in); err != nil {
		response.Error(w, err)
		return
	}
	result, err := h.svc.Adjust(r.Context(), id, in)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

func (h *Handler) movements(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, productNotFound())
		return
	}
	result, err := h.svc.Movements(r.Context(), id)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}
