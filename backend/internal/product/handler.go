package product

import "net/http"

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/products", h.list)
	mux.HandleFunc("POST /api/products", h.create)
	mux.HandleFunc("PUT /api/products/{id}", h.update)
	mux.HandleFunc("DELETE /api/products/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
}
