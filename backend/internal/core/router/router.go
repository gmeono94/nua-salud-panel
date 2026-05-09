// Configuración del router Gin y registro de rutas.
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

// Setup crea y configura el router Gin con middlewares y rutas.
func Setup() *gin.Engine {
	r := gin.Default()

	// CORS permisivo para desarrollo local
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Inicializar queries del dashboard
	dashboardQueries := dashboardsqlc.New(db.DashboardPool)

	// Grupo base para la API
	v1 := r.Group("/api/v1")

	// Health check
	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Módulo de autenticación
	auth.Setup(v1, dashboardQueries)

	// TODO: Registrar módulos de métricas cuando se implemente el schema operativo
	// appointments.Setup(v1, operationalQueries, dashboardQueries)
	// occupancy.Setup(v1, operationalQueries, dashboardQueries)
	// patients.Setup(v1, operationalQueries, dashboardQueries)
	// revenue.Setup(v1, operationalQueries, dashboardQueries)
	// doctors.Setup(v1, operationalQueries, dashboardQueries)

	return r
}
