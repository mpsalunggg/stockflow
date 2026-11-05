package order

import (
	"cmp"
	"context"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mpsalunggg/stockflow/backend/internal/database"
	apperrors "github.com/mpsalunggg/stockflow/backend/internal/shared/errors"
)

const reserveStock = `
	UPDATE products SET stock = stock - $2
	WHERE sku = $1 AND stock >= $2 AND is_active
	RETURNING id, price`

const insertMovement = `
	INSERT INTO stock_movements (product_id, type, qty, note)
	VALUES ($1, $2, $3, $4)`

type querier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type reservation struct {
	productID int
	price     int
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, in CreateInput, idempotencyKey, hash string) (Order, bool, error) {
	var order Order
	var replayed bool
	err := database.WithTx(ctx, r.pool, func(tx pgx.Tx) error {
		if idempotencyKey != "" {
			existingID, claimed, err := claimIdempotencyKey(ctx, tx, idempotencyKey, hash)
			if err != nil {
				return err
			}
			if !claimed {
				replayed = true
				order, err = getOrder(ctx, tx, existingID)
				return err
			}
		}

		if err := checkProducts(ctx, tx, in.Items); err != nil {
			return err
		}

		reserved, err := reserveItems(ctx, tx, in.Items)
		if err != nil {
			return err
		}

		total := 0
		for _, item := range in.Items {
			total += *item.Qty * reserved[item.SKU].price
		}

		var orderID int
		err = tx.QueryRow(ctx,
			"INSERT INTO sales_orders (customer, total) VALUES ($1, $2) RETURNING id",
			in.Customer, total,
		).Scan(&orderID)
		if err != nil {
			return fmt.Errorf("insert order: %w", err)
		}

		note := "Order #" + strconv.Itoa(orderID)
		for _, item := range in.Items {
			res := reserved[item.SKU]
			if _, err := tx.Exec(ctx,
				"INSERT INTO sales_order_items (order_id, sku, qty, unit_price) VALUES ($1, $2, $3, $4)",
				orderID, item.SKU, *item.Qty, res.price,
			); err != nil {
				return fmt.Errorf("insert order item: %w", err)
			}
			if _, err := tx.Exec(ctx, insertMovement, res.productID, "out", *item.Qty, note); err != nil {
				return fmt.Errorf("insert movement: %w", err)
			}
		}

		if idempotencyKey != "" {
			if _, err := tx.Exec(ctx,
				"UPDATE idempotency_keys SET order_id = $2 WHERE key = $1",
				idempotencyKey, orderID,
			); err != nil {
				return fmt.Errorf("save idempotency key: %w", err)
			}
		}

		order, err = getOrder(ctx, tx, orderID)
		return err
	})
	return order, replayed, err
}

func (r *Repository) Get(ctx context.Context, id int) (Order, error) {
	return getOrder(ctx, r.pool, id)
}

func (r *Repository) Cancel(ctx context.Context, id int) (Order, error) {
	var order Order
	err := database.WithTx(ctx, r.pool, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx,
			"UPDATE sales_orders SET status = $2, cancelled_at = now() WHERE id = $1 AND status = $3",
			id, statusCancelled, statusCreated,
		)
		if err != nil {
			return fmt.Errorf("cancel order: %w", err)
		}
		if tag.RowsAffected() == 0 {
			return rejectCancel(ctx, tx, id)
		}

		rows, err := tx.Query(ctx,
			"SELECT sku, qty FROM sales_order_items WHERE order_id = $1 ORDER BY sku",
			id,
		)
		if err != nil {
			return fmt.Errorf("read order items: %w", err)
		}
		items, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (ItemInput, error) {
			var item ItemInput
			err := row.Scan(&item.SKU, &item.Qty)
			return item, err
		})
		if err != nil {
			return fmt.Errorf("read order items: %w", err)
		}

		note := "Cancel order #" + strconv.Itoa(id)
		for _, item := range items {
			var productID int
			err := tx.QueryRow(ctx,
				"UPDATE products SET stock = stock + $2 WHERE sku = $1 RETURNING id",
				item.SKU, *item.Qty,
			).Scan(&productID)
			if err != nil {
				return fmt.Errorf("restore stock: %w", err)
			}
			if _, err := tx.Exec(ctx, insertMovement, productID, "in", *item.Qty, note); err != nil {
				return fmt.Errorf("insert movement: %w", err)
			}
		}

		order, err = getOrder(ctx, tx, id)
		return err
	})
	return order, err
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Summary, int, error) {
	var conditions []string
	var args []any
	if params.Search != "" {
		args = append(args, database.LikePattern(params.Search))
		condition := fmt.Sprintf("o.customer ILIKE $%d", len(args))
		if id, err := strconv.Atoi(params.Search); err == nil {
			args = append(args, id)
			condition = fmt.Sprintf("(%s OR o.id = $%d)", condition, len(args))
		}
		conditions = append(conditions, condition)
	}
	if params.Status != "" {
		args = append(args, params.Status)
		conditions = append(conditions, fmt.Sprintf("o.status = $%d", len(args)))
	}
	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT count(*) FROM sales_orders o"+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count orders: %w", err)
	}

	n := len(args)
	query := fmt.Sprintf(`
		SELECT o.id, o.customer, o.status, o.total,
			(SELECT count(*) FROM sales_order_items i WHERE i.order_id = o.id),
			o.created_at, o.cancelled_at
		FROM sales_orders o%s
		ORDER BY o.created_at DESC, o.id DESC
		LIMIT $%d OFFSET $%d`, where, n+1, n+2)
	rows, err := r.pool.Query(ctx, query, append(args, params.Limit, params.Offset())...)
	if err != nil {
		return nil, 0, fmt.Errorf("list orders: %w", err)
	}
	orders, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (Summary, error) {
		var s Summary
		err := row.Scan(&s.ID, &s.Customer, &s.Status, &s.Total, &s.ItemCount, &s.CreatedAt, &s.CancelledAt)
		return s, err
	})
	if err != nil {
		return nil, 0, fmt.Errorf("scan orders: %w", err)
	}
	if orders == nil {
		orders = []Summary{}
	}
	return orders, total, nil
}

func claimIdempotencyKey(ctx context.Context, tx pgx.Tx, key, hash string) (int, bool, error) {
	tag, err := tx.Exec(ctx,
		"INSERT INTO idempotency_keys (key, request_hash) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
		key, hash,
	)
	if err != nil {
		return 0, false, fmt.Errorf("claim idempotency key: %w", err)
	}
	if tag.RowsAffected() == 1 {
		return 0, true, nil
	}

	var storedHash string
	var orderID *int
	err = tx.QueryRow(ctx,
		"SELECT request_hash, order_id FROM idempotency_keys WHERE key = $1",
		key,
	).Scan(&storedHash, &orderID)
	if err != nil {
		return 0, false, fmt.Errorf("read idempotency key: %w", err)
	}
	if storedHash != hash || orderID == nil {
		return 0, false, idempotencyKeyReused()
	}
	return *orderID, false, nil
}

func checkProducts(ctx context.Context, tx pgx.Tx, items []ItemInput) error {
	skus := make([]string, len(items))
	for i, item := range items {
		skus[i] = item.SKU
	}

	rows, err := tx.Query(ctx, "SELECT sku, is_active FROM products WHERE sku = ANY($1)", skus)
	if err != nil {
		return fmt.Errorf("check products: %w", err)
	}
	active := map[string]bool{}
	var sku string
	var isActive bool
	if _, err := pgx.ForEachRow(rows, []any{&sku, &isActive}, func() error {
		active[sku] = isActive
		return nil
	}); err != nil {
		return fmt.Errorf("check products: %w", err)
	}

	details := map[string]string{}
	for i, item := range items {
		isActive, found := active[item.SKU]
		switch {
		case !found:
			details[itemKey(i)+".sku"] = "unknown sku"
		case !isActive:
			details[itemKey(i)+".sku"] = "product is inactive"
		}
	}
	if len(details) > 0 {
		return apperrors.Validation(details)
	}
	return nil
}

func reserveItems(ctx context.Context, tx pgx.Tx, items []ItemInput) (map[string]reservation, error) {
	sorted := slices.SortedFunc(slices.Values(items), func(a, b ItemInput) int {
		return cmp.Compare(a.SKU, b.SKU)
	})

	reserved := make(map[string]reservation, len(items))
	for _, item := range sorted {
		var res reservation
		err := tx.QueryRow(ctx, reserveStock, item.SKU, *item.Qty).Scan(&res.productID, &res.price)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, rejectItem(ctx, tx, items, item.SKU)
		}
		if err != nil {
			return nil, fmt.Errorf("reserve stock: %w", err)
		}
		reserved[item.SKU] = res
	}
	return reserved, nil
}

func rejectItem(ctx context.Context, tx pgx.Tx, items []ItemInput, sku string) error {
	var stock int
	var isActive bool
	err := tx.QueryRow(ctx, "SELECT stock, is_active FROM products WHERE sku = $1", sku).Scan(&stock, &isActive)
	if err != nil {
		return fmt.Errorf("read stock: %w", err)
	}
	if !isActive {
		index := slices.IndexFunc(items, func(item ItemInput) bool { return item.SKU == sku })
		return apperrors.Validation(map[string]string{itemKey(index) + ".sku": "product is inactive"})
	}
	return insufficientStock(sku, stock)
}

func rejectCancel(ctx context.Context, tx pgx.Tx, id int) error {
	var exists bool
	if err := tx.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM sales_orders WHERE id = $1)", id).Scan(&exists); err != nil {
		return fmt.Errorf("check order: %w", err)
	}
	if !exists {
		return orderNotFound()
	}
	return alreadyCancelled()
}

func getOrder(ctx context.Context, q querier, id int) (Order, error) {
	var o Order
	err := q.QueryRow(ctx,
		"SELECT id, customer, status, total, created_at, cancelled_at FROM sales_orders WHERE id = $1",
		id,
	).Scan(&o.ID, &o.Customer, &o.Status, &o.Total, &o.CreatedAt, &o.CancelledAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Order{}, orderNotFound()
	}
	if err != nil {
		return Order{}, fmt.Errorf("get order: %w", err)
	}

	rows, err := q.Query(ctx, `
		SELECT i.id, i.sku, p.name, i.qty, i.unit_price
		FROM sales_order_items i
		JOIN products p ON p.sku = i.sku
		WHERE i.order_id = $1
		ORDER BY i.id`,
		id,
	)
	if err != nil {
		return Order{}, fmt.Errorf("get order items: %w", err)
	}
	o.Items, err = pgx.CollectRows(rows, func(row pgx.CollectableRow) (Item, error) {
		var item Item
		err := row.Scan(&item.ID, &item.SKU, &item.Name, &item.Qty, &item.UnitPrice)
		item.Subtotal = item.Qty * item.UnitPrice
		return item, err
	})
	if err != nil {
		return Order{}, fmt.Errorf("get order items: %w", err)
	}
	return o, nil
}
