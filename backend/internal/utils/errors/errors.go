// Manejo de errores con el patrón Either para respuestas consistentes.
package errors

import "net/http"

// AppError representa un error de la aplicación con código HTTP y mensaje.
type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *AppError) Error() string {
	return e.Message
}

// Errores comunes predefinidos

func NotFound(message string) *AppError {
	return &AppError{Code: http.StatusNotFound, Message: message}
}

func BadRequest(message string) *AppError {
	return &AppError{Code: http.StatusBadRequest, Message: message}
}

func Internal(message string) *AppError {
	return &AppError{Code: http.StatusInternalServerError, Message: message}
}
