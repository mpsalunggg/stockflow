package stock

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mpsalunggg/stockflow/backend/internal/database"
)

const (
	increaseStock = `UPDATE products SET stock = stock + $2 WHERE id = $1 RETURNING stock`
	decreaseStock = `UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2 RETURNING stock`
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Adjust(ctx context.Context, productID int, in AdjustInput) (AdjustResult, error) {
	var result AdjustResult
	err := database.WithTx(ctx, r.pool, func(tx pgx.Tx) error {
		query := increaseStock
		if in.Type == typeOut {
			query = decreaseStock
		}

		err := tx.QueryRow(ctx, query, productID, *in.Qty).Scan(&result.Stock)
		if errors.Is(err, pgx.ErrNoRows) {
			return rejectAdjustment(ctx, tx, productID)
		}
		if err != nil {
			return fmt.Errorf("update stock: %w", err)
		}

		rows, err := tx.Query(ctx, `
			INSERT INTO stock_movements (product_id, type, qty, note)
			VALUES ($1, $2, $3, $4)
			RETURNING id, product_id, type, qty, note, created_at`,
			productID, in.Type, *in.Qty, in.Note,
		)
		if err != nil {
			return fmt.Errorf("insert movement: %w", err)
		}
		result.Movement, err = pgx.CollectExactlyOneRow(rows, scanMovement)
		if err != nil {
			return fmt.Errorf("insert movement: %w", err)
		}
		return nil
	})
	return result, err
}

func (r *Repository) ListMovements(ctx context.Context, productID int) ([]Movement, error) {
	var exists bool
	if err := r.pool.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM products WHERE id = $1)", productID).Scan(&exists); err != nil {
		return nil, fmt.Errorf("check product: %w", err)
	}
	if !exists {
		return nil, productNotFound()
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, product_id, type, qty, note, created_at
		FROM stock_movements
		WHERE product_id = $1
		ORDER BY created_at DESC, id DESC`,
		productID,
	)
	if err != nil {
		return nil, fmt.Errorf("list movements: %w", err)
	}
	movements, err := pgx.CollectRows(rows, scanMovement)
	if err != nil {
		return nil, fmt.Errorf("scan movements: %w", err)
	}
	if movements == nil {
		movements = []Movement{}
	}
	return movements, nil
}

func rejectAdjustment(ctx context.Context, tx pgx.Tx, productID int) error {
	var sku string
	var stock int
	err := tx.QueryRow(ctx, "SELECT sku, stock FROM products WHERE id = $1", productID).Scan(&sku, &stock)
	if errors.Is(err, pgx.ErrNoRows) {
		return productNotFound()
	}
	if err != nil {
		return fmt.Errorf("read stock: %w", err)
	}
	return insufficientStock(sku, stock)
}

func scanMovement(row pgx.CollectableRow) (Movement, error) {
	var m Movement
	err := row.Scan(&m.ID, &m.ProductID, &m.Type, &m.Qty, &m.Note, &m.CreatedAt)
	return m, err
}
