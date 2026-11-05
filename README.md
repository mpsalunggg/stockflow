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
