// Configuración del router Gin y registro de rutas.
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Setup crea y configura el router Gin con middlewares y rutas.
func Setup() *gin.Engine {
	r := gin.Default()

	// CORS permisivo para desarrollo local
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// Grupo base para la API
	v1 := r.Group("/api/v1")

	// Health check
	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// TODO: Registrar rutas de cada módulo cuando se implementen
	// appointments.Setup(v1)
	// occupancy.Setup(v1)
	// patients.Setup(v1)
	// revenue.Setup(v1)
	// doctors.Setup(v1)

	return r
}
