package order

import "time"

const (
	statusCreated   = "CREATED"
	statusCancelled = "CANCELLED"
)

type Order struct {
	ID          int        `json:"id"`
	Customer    string     `json:"customer"`
	Status      string     `json:"status"`
	Total       int        `json:"total"`
	CreatedAt   time.Time  `json:"created_at"`
	CancelledAt *time.Time `json:"cancelled_at"`
	Items       []Item     `json:"items"`
}

type Item struct {
	ID        int    `json:"id"`
	SKU       string `json:"sku"`
	Name      string `json:"name"`
	Qty       int    `json:"qty"`
	UnitPrice int    `json:"unit_price"`
	Subtotal  int    `json:"subtotal"`
}

type Summary struct {
	ID          int        `json:"id"`
	Customer    string     `json:"customer"`
	Status      string     `json:"status"`
	Total       int        `json:"total"`
	ItemCount   int        `json:"item_count"`
	CreatedAt   time.Time  `json:"created_at"`
	CancelledAt *time.Time `json:"cancelled_at"`
}
