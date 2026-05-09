// Middlewares de autenticación y autorización.
// AuthMiddleware valida el JWT en cada request protegido.
// RoleMiddleware restringe acceso por rol de usuario.
package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/domain/services"
)

// AuthMiddleware valida el token JWT del header Authorization.
// Inyecta user_id, email, role y clinic_ids en el contexto de Gin.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token de autorización requerido"})
			return
		}

		// Formato esperado: "Bearer <token>"
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			return
		}

		claims, err := services.ValidateAccessToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
			return
		}

		// Inyectar datos del usuario en el contexto
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("clinic_ids", claims.ClinicIDs)

		c.Next()
	}
}

// RoleMiddleware restringe el acceso a los roles especificados.
// Debe usarse después de AuthMiddleware.
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
			return
		}

		for _, allowed := range allowedRoles {
			if role.(string) == allowed {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "No tienes permisos para esta acción"})
	}
}
