package product

import "time"

type Product struct {
	ID             int        `json:"id"`
	SKU            string     `json:"sku"`
	Name           string     `json:"name"`
	Price          int        `json:"price"`
	Stock          int        `json:"stock"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	LastMovementAt *time.Time `json:"last_movement_at"`
}

type Summary struct {
	TotalProducts  int   `json:"total_products"`
	ActiveProducts int   `json:"active_products"`
	StockValue     int64 `json:"stock_value"`
	LowStockCount  int   `json:"low_stock_count"`
}
