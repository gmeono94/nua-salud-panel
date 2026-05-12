// Parseo de query params comunes para los endpoints de métricas.
package filters

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/operationalsqlc"
)

// DateRange contiene el rango de fechas parseado desde query params.
type DateRange struct {
	From pgtype.Date
	To   pgtype.Date
	Days int32
}

// ParseDateRange extrae date_from y date_to del query string.
// Retorna error si faltan o tienen formato inválido.
func ParseDateRange(c *gin.Context) (DateRange, error) {
	fromStr := c.Query("date_from")
	toStr := c.Query("date_to")

	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		return DateRange{}, err
	}
	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		return DateRange{}, err
	}

	if to.Before(from) {
		return DateRange{}, fmt.Errorf("date_to no puede ser anterior a date_from")
	}

	days := int32(to.Sub(from).Hours()/24) + 1

	return DateRange{
		From: pgtype.Date{Time: from, Valid: true},
		To:   pgtype.Date{Time: to, Valid: true},
		Days: days,
	}, nil
}

// OptionalText retorna pgtype.Text con Valid=true si el param existe, o Valid=false si no.
func OptionalText(c *gin.Context, param string) pgtype.Text {
	v := c.Query(param)
	if v == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: v, Valid: true}
}

// OptionalSpecialty retorna NullSpecialty desde un query param.
func OptionalSpecialty(c *gin.Context, param string) operationalsqlc.NullSpecialty {
	v := c.Query(param)
	if v == "" {
		return operationalsqlc.NullSpecialty{}
	}
	return operationalsqlc.NullSpecialty{
		Specialty: operationalsqlc.Specialty(v),
		Valid:     true,
	}
}
