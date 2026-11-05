package database

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

const (
	uniqueViolation     = "23505"
	foreignKeyViolation = "23503"
)

func IsUniqueViolation(err error) bool {
	return hasCode(err, uniqueViolation)
}

func IsForeignKeyViolation(err error) bool {
	return hasCode(err, foreignKeyViolation)
}

func hasCode(err error, code string) bool {
	pgErr, ok := errors.AsType[*pgconn.PgError](err)
	return ok && pgErr.Code == code
}
