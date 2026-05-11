// Registro de rutas del módulo de autenticación.
package auth

import (
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/domain/services"
	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/interface/controllers"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/middlewares"
)

// Setup registra las rutas de autenticación en el grupo de API.
func Setup(rg *gin.RouterGroup, queries *dashboardsqlc.Queries) {
	authService := services.NewAuthService(queries)
	controller := controllers.NewAuthController(authService, queries)

	auth := rg.Group("/auth")
	{
		// Rutas públicas (no requieren JWT)
		auth.POST("/login", controller.Login)
		auth.POST("/refresh", controller.Refresh)

		// Rutas protegidas (requieren JWT)
		auth.POST("/logout", middlewares.AuthMiddleware(), controller.Logout)
		auth.GET("/me", middlewares.AuthMiddleware(), controller.Me)
	}
}
