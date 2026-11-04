package order

import "net/http"

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/orders", h.create)
	mux.HandleFunc("GET /api/orders/{id}", h.get)
	mux.HandleFunc("POST /api/orders/{id}/cancel", h.cancel)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) cancel(w http.ResponseWriter, r *http.Request) {
}
