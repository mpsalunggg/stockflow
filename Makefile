export DATABASE_URL ?= postgres://stockflow:stockflow_secret@localhost:5432/stockflow?sslmode=disable

GOOSE := go run github.com/pressly/goose/v3/cmd/goose@v3.29.0

.PHONY: db-up db-reset migrate seed run test

db-up:
	docker compose up -d --wait postgres

db-reset:
	docker compose down -v
	docker compose up -d --wait postgres

migrate: db-up
	cd backend && $(GOOSE) -dir migrations postgres "$(DATABASE_URL)" up

seed: migrate
	cd backend && $(GOOSE) -dir seeds -no-versioning postgres "$(DATABASE_URL)" up

run: db-up
	cd backend && go run ./cmd/api

test:
	cd backend && go test -race ./...
