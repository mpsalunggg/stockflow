package order

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
	mux.HandleFunc("GET /api/orders", h.list)
	mux.HandleFunc("POST /api/orders", h.create)
	mux.HandleFunc("GET /api/orders/{id}", h.get)
	mux.HandleFunc("POST /api/orders/{id}/cancel", h.cancel)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	params, err := parseListParams(r.URL.Query())
	if err != nil {
		response.Error(w, err)
		return
	}
	result, err := h.svc.List(r.Context(), params)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var in CreateInput
	if err := request.DecodeJSON(w, r, &in); err != nil {
		response.Error(w, err)
		return
	}
	order, err := h.svc.Create(r.Context(), in)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, order)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, orderNotFound())
		return
	}
	order, err := h.svc.Get(r.Context(), id)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, order)
}

func (h *Handler) cancel(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, orderNotFound())
		return
	}
	order, err := h.svc.Cancel(r.Context(), id)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, order)
}
