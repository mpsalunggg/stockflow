package stock

import "net/http"

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/products/{id}/stock", h.adjust)
	mux.HandleFunc("GET /api/products/{id}/movements", h.movements)
}

func (h *Handler) adjust(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) movements(w http.ResponseWriter, r *http.Request) {
}
