package product

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const selectProduct = `
SELECT p.id, p.sku, p.name, p.price, p.stock, p.is_active, p.created_at, m.last_movement_at
FROM products p
LEFT JOIN LATERAL (
	SELECT max(created_at) AS last_movement_at
	FROM stock_movements
	WHERE product_id = p.id
) m ON true`

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Product, int, error) {
	where := ""
	args := []any{}
	if params.Search != "" {
		where = " WHERE p.sku ILIKE $1 OR p.name ILIKE $1"
		args = append(args, likePattern(params.Search))
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT count(*) FROM products p"+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count products: %w", err)
	}

	n := len(args)
	query := fmt.Sprintf("%s%s ORDER BY p.id LIMIT $%d OFFSET $%d", selectProduct, where, n+1, n+2)
	rows, err := r.pool.Query(ctx, query, append(args, params.Limit, params.offset())...)
	if err != nil {
		return nil, 0, fmt.Errorf("list products: %w", err)
	}
	products, err := pgx.CollectRows(rows, scanProduct)
	if err != nil {
		return nil, 0, fmt.Errorf("scan products: %w", err)
	}
	return products, total, nil
}

func (r *Repository) Create(ctx context.Context, in ProductInput) (Product, error) {
	isActive := true
	if in.IsActive != nil {
		isActive = *in.IsActive
	}
	var p Product
	err := r.pool.QueryRow(ctx, `
		INSERT INTO products (sku, name, price, is_active)
		VALUES ($1, $2, $3, $4)
		RETURNING id, sku, name, price, stock, is_active, created_at`,
		in.SKU, in.Name, *in.Price, isActive,
	).Scan(&p.ID, &p.SKU, &p.Name, &p.Price, &p.Stock, &p.IsActive, &p.CreatedAt)
	if err != nil {
		return Product{}, mapPgError(err, in.SKU)
	}
	return p, nil
}

func (r *Repository) Update(ctx context.Context, id int, in ProductInput) (Product, error) {
	_, err := r.pool.Exec(ctx, `
		UPDATE products SET sku = $2, name = $3, price = $4, is_active = $5
		WHERE id = $1`,
		id, in.SKU, in.Name, *in.Price, *in.IsActive,
	)
	if err != nil {
		return Product{}, mapPgError(err, in.SKU)
	}
	return r.get(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id int) error {
	tag, err := r.pool.Exec(ctx, "DELETE FROM products WHERE id = $1", id)
	if err != nil {
		return mapPgError(err, "")
	}
	if tag.RowsAffected() == 0 {
		return productNotFound()
	}
	return nil
}

func (r *Repository) get(ctx context.Context, id int) (Product, error) {
	rows, err := r.pool.Query(ctx, selectProduct+" WHERE p.id = $1", id)
	if err != nil {
		return Product{}, fmt.Errorf("get product: %w", err)
	}
	p, err := pgx.CollectExactlyOneRow(rows, scanProduct)
	if errors.Is(err, pgx.ErrNoRows) {
		return Product{}, productNotFound()
	}
	if err != nil {
		return Product{}, fmt.Errorf("get product: %w", err)
	}
	return p, nil
}

func scanProduct(row pgx.CollectableRow) (Product, error) {
	var p Product
	err := row.Scan(&p.ID, &p.SKU, &p.Name, &p.Price, &p.Stock, &p.IsActive, &p.CreatedAt, &p.LastMovementAt)
	return p, err
}
