// Middleware de validación de API key.
// Identifica el origen de las peticiones (dashboard, tests, servicios externos).
package middlewares

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

// APIKeyMiddleware valida la API key del header X-API-Key.
// Inyecta api_key_name en el contexto para trazabilidad.
func APIKeyMiddleware(queries *dashboardsqlc.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-API-Key")
		if key == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "API key requerida (header X-API-Key)"})
			return
		}

		hash := hashKey(key)
		result, err := queries.ValidateAPIKey(c.Request.Context(), hash)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "API key inválida o inactiva"})
			return
		}

		c.Set("api_key_name", result.Name)
		c.Next()
	}
}

func hashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}
