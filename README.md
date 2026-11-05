# StockFlow

Small inventory and sales app: manage products, adjust stock, and record sales orders that take stock out.

## Run with Docker

```bash
docker compose up --build
```

Open http://localhost:3000. The API is on http://localhost:8080/api.

The API runs the migrations and loads the seed data (14 products, 2 orders) on startup. Use `docker compose down -v` to start from an empty database. If a port is busy, override it: `WEB_PORT=3001 API_PORT=8081 POSTGRES_PORT=5433 docker compose up --build`.

## Run locally

Needs Go 1.26, Node 20+, pnpm 10 and Docker for Postgres.

```bash
make seed            # Postgres in Docker, migrations, seed data
make run             # API on :8080

cd frontend
pnpm install
pnpm dev             # app on :5173, /api is proxied to :8080
```

Settings are in `backend/.env.example` (`DATABASE_URL`, `PORT`, `DB_SEED`).

The API contract and curl examples are in [backend/http/README.md](backend/http/README.md).

## Design decisions

- Stock is decremented with `UPDATE ... SET stock = stock - $2 WHERE ... AND stock >= $2`. Postgres locks the row, so a concurrent request re-checks against the committed value and gets 409 when there is not enough left. Stock adjustments use the same guard, and `CHECK (stock >= 0)` stays in the schema as a backstop.
- Creating an order validates the input first (customer, items, qty, duplicate, unknown or inactive SKUs), then runs in one transaction. Items are locked in SKU order to avoid deadlocks, unit prices come from the database, and if any item fails nothing is written.
- Cancel uses `WHERE status = 'CREATED'`, so stock is restored only once even when the request is repeated.
- `last_movement_at` is read from `stock_movements` with a lateral `max(created_at)`, so there is no copy on the product row to keep in sync.
- Every stock change writes a movement in the same transaction. Orders and cancels write one too ("Order #12", "Cancel order #12").
- Stock cannot be set through `POST` or `PUT /products`. A product with movements or order lines cannot be deleted and returns 409 `PRODUCT_HAS_HISTORY`.
- Money is integer rupiah. The total stock value is summed as `bigint`.
- The product filter and the summary cards are computed on the server, so paging and totals always match the database.
- Three endpoints were added beyond the brief: `GET /products/{id}`, `GET /products/summary` and `GET /orders`.
- In the frontend, `lib/api.ts` does all fetching and error parsing. TanStack Query refreshes related data after each mutation, and search, filters and paging live in the URL. The 409 from the backend is shown in the Adjust Stock dialog and on the failing row in Create Order.
- The Vite dev server and nginx in Docker both proxy `/api`, so the API needs no CORS setup.

## What I would improve

- Automated tests. Everything so far was checked by hand: curl and the `.http` files, parallel requests for the concurrency cases, and the UI flows in a headless browser. Next would be Go integration tests (overdraw writes nothing, happy path, `go test -race`) and Vitest for the schemas and formatting helpers.
- `Idempotency-Key` on `POST /api/orders`, so a retried request cannot create a second order.
- The daily sales report.
- Paging for movement history.
- Authentication, and recording who made each change.

## Time spent

More than 8 hours.
