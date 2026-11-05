package database

import (
	"fmt"
	"io/fs"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/mpsalunggg/stockflow/backend/migrations"
	"github.com/mpsalunggg/stockflow/backend/seeds"
)

func Migrate(pool *pgxpool.Pool) error {
	if err := up(pool, migrations.FS); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	return nil
}

func Seed(pool *pgxpool.Pool) error {
	if err := up(pool, seeds.FS, goose.WithNoVersioning()); err != nil {
		return fmt.Errorf("run seeds: %w", err)
	}
	return nil
}

func up(pool *pgxpool.Pool, fsys fs.FS, opts ...goose.OptionsFunc) error {
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	goose.SetBaseFS(fsys)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(db, ".", opts...)
}
