// Configuración del router Gin y registro de rutas.
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth"
	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/metrics"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/operationalsqlc"
)

// Setup crea y configura el router Gin con middlewares y rutas.
func Setup() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	dashboardQueries := dashboardsqlc.New(db.DashboardPool)
	operationalQueries := operationalsqlc.New(db.OperationalPool)

	v1 := r.Group("/api/v1")

	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	auth.Setup(v1, dashboardQueries)
	metrics.Setup(v1, operationalQueries)

	return r
}
