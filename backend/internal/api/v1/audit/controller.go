// Controller de bitácora de auditoría.
package audit

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

func formatUUID(b [16]byte) string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

type Controller struct {
	q *dashboardsqlc.Queries
}

func NewController(q *dashboardsqlc.Queries) *Controller {
	return &Controller{q: q}
}

// List — GET /api/v1/audit-logs?page=1&page_size=50&user_id=&start_date=&end_date=
func (ctrl *Controller) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	params := dashboardsqlc.ListAuditLogsParams{
		PageSize:   int32(pageSize),
		PageOffset: int32((page - 1) * pageSize),
	}

	if uid := c.Query("user_id"); uid != "" {
		var u pgtype.UUID
		if err := u.Scan(uid); err == nil {
			params.UserID = u
		}
	}

	if sd := c.Query("start_date"); sd != "" {
		if t, err := time.Parse("2006-01-02", sd); err == nil {
			params.StartDate = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	if ed := c.Query("end_date"); ed != "" {
		if t, err := time.Parse("2006-01-02", ed); err == nil {
			params.EndDate = pgtype.Timestamptz{Time: t.Add(24*time.Hour - time.Second), Valid: true}
		}
	}

	rows, err := ctrl.q.ListAuditLogs(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando bitácora"})
		return
	}

	type entry struct {
		ID        string `json:"id"`
		UserName  string `json:"user_name"`
		UserEmail string `json:"user_email"`
		Action    string `json:"action"`
		Resource  string `json:"resource"`
		Details   any    `json:"details"`
		IP        string `json:"ip"`
		CreatedAt string `json:"created_at"`
	}

	result := make([]entry, 0, len(rows))
	for _, r := range rows {
		e := entry{
			Action:    string(r.Action),
			CreatedAt: r.CreatedAt.Time.Format(time.RFC3339),
		}

		if r.ID.Valid {
			b := r.ID.Bytes
			e.ID = formatUUID(b)
		}
		if r.UserName.Valid {
			e.UserName = r.UserName.String
		}
		if r.UserEmail.Valid {
			e.UserEmail = r.UserEmail.String
		}
		if r.Resource.Valid {
			e.Resource = r.Resource.String
		}
		if r.IpAddress != nil {
			e.IP = r.IpAddress.String()
		}
		if len(r.Details) > 0 {
			var details any
			if err := json.Unmarshal(r.Details, &details); err == nil {
				e.Details = details
			}
		}
		result = append(result, e)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
		"page": page,
		"page_size": pageSize,
	})
}
