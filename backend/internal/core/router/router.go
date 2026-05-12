// Configuración del router Gin y registro de rutas.
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/audit"
	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth"
	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/metrics"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/operationalsqlc"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/middlewares"
)

// Setup crea y configura el router Gin con middlewares y rutas.
func Setup() *gin.Engine {
	r := gin.Default()

	r.Use(middlewares.RequestIDMiddleware())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5175"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		AllowCredentials: true,
	}))

	dashboardQueries := dashboardsqlc.New(db.DashboardPool)
	operationalQueries := operationalsqlc.New(db.OperationalPool)

	v1 := r.Group("/api/v1")

	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth — requiere API key pero no JWT (es donde se obtiene el JWT)
	authGroup := v1.Group("")
	authGroup.Use(middlewares.APIKeyMiddleware(dashboardQueries))
	auth.Setup(authGroup, dashboardQueries)

	// Métricas y filtros — requieren API key + JWT
	protected := v1.Group("")
	protected.Use(middlewares.APIKeyMiddleware(dashboardQueries))
	protected.Use(middlewares.AuthMiddleware())
	protected.Use(middlewares.ClinicAccessMiddleware())
	protected.Use(middlewares.AuditMiddleware(dashboardQueries))
	metrics.Setup(protected, operationalQueries)

	// Bitácora — requiere API key + JWT + rol admin
	auditCtrl := audit.NewController(dashboardQueries)
	protected.GET("/audit-logs", middlewares.RoleMiddleware("admin"), auditCtrl.List)

	return r
}
