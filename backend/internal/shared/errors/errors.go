package errors

import (
	"errors"
	"net/http"
)

type Error struct {
	Status  int
	Code    string
	Message string
	Fields  map[string]any
}

func (e *Error) Error() string {
	if e.Message != "" {
		return e.Code + ": " + e.Message
	}
	return e.Code
}

func From(err error) (*Error, bool) {
	var e *Error
	ok := errors.As(err, &e)
	return e, ok
}

func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "BAD_REQUEST", Message: message}
}

func Validation(details map[string]string) *Error {
	return &Error{
		Status:  http.StatusBadRequest,
		Code:    "VALIDATION_ERROR",
		Message: "request validation failed",
		Fields:  map[string]any{"details": details},
	}
}

func NotFound(message string) *Error {
	return &Error{Status: http.StatusNotFound, Code: "NOT_FOUND", Message: message}
}

func Conflict(code string, fields map[string]any) *Error {
	return &Error{Status: http.StatusConflict, Code: code, Fields: fields}
}

func Internal() *Error {
	return &Error{Status: http.StatusInternalServerError, Code: "INTERNAL", Message: "internal server error"}
}
