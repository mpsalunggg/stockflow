package product

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
	mux.HandleFunc("GET /api/products", h.list)
	mux.HandleFunc("POST /api/products", h.create)
	mux.HandleFunc("GET /api/products/{id}", h.get)
	mux.HandleFunc("PUT /api/products/{id}", h.update)
	mux.HandleFunc("DELETE /api/products/{id}", h.delete)
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

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, productNotFound())
		return
	}
	p, err := h.svc.Get(r.Context(), id)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var in ProductInput
	if err := request.DecodeJSON(w, r, &in); err != nil {
		response.Error(w, err)
		return
	}
	p, err := h.svc.Create(r.Context(), in)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, p)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, productNotFound())
		return
	}
	var in ProductInput
	if err := request.DecodeJSON(w, r, &in); err != nil {
		response.Error(w, err)
		return
	}
	p, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := request.PathID(r)
	if !ok {
		response.Error(w, productNotFound())
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.Error(w, err)
		return
	}
	response.NoContent(w)
}
