// Middleware de auditoría para registrar vistas de métricas.
package middlewares

import (
	"context"
	"encoding/json"
	"log"
	"net/netip"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

func AuditMiddleware(q *dashboardsqlc.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if c.Writer.Status() >= 400 {
			return
		}

		path := c.Request.URL.Path
		if !strings.Contains(path, "/metrics/") {
			return
		}

		parts := strings.Split(path, "/metrics/")
		resource := "metrics"
		if len(parts) > 1 {
			resource = parts[1]
		}

		details := make(map[string]string)
		for key, values := range c.Request.URL.Query() {
			if len(values) > 0 && values[0] != "" {
				details[key] = values[0]
			}
		}

		detailsJSON, _ := json.Marshal(details)

		params := dashboardsqlc.CreateAuditLogParams{
			Action:   dashboardsqlc.AuditActionViewMetric,
			Resource: pgtype.Text{String: resource, Valid: true},
			Details:  detailsJSON,
		}

		if userID, exists := c.Get("user_id"); exists {
			var uid pgtype.UUID
			_ = uid.Scan(userID.(string))
			params.UserID = uid
		}

		if addr, err := netip.ParseAddr(c.ClientIP()); err == nil {
			params.IpAddress = &addr
		}

		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := q.CreateAuditLog(ctx, params); err != nil {
				log.Printf("audit: error registrando log: %v", err)
			}
		}()
	}
}
