package middlewares

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// ClinicAccessMiddleware restringe a clinic_director a sus clínicas asignadas.
func ClinicAccessMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "clinic_director" {
			c.Next()
			return
		}

		requested := c.Query("clinic_id")
		if requested == "" {
			c.Next()
			return
		}

		allowed, exists := c.Get("clinic_ids")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Sin clínicas asignadas"})
			return
		}

		clinicIDs, ok := allowed.([]int32)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Sin clínicas asignadas"})
			return
		}

		for _, id := range strings.Split(requested, ",") {
			n, err := strconv.Atoi(strings.TrimSpace(id))
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "clinic_id inválido"})
				return
			}
			if !containsInt(clinicIDs, int32(n)) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "No tienes acceso a esta clínica"})
				return
			}
		}

		c.Next()
	}
}

func containsInt(slice []int32, val int32) bool {
	for _, v := range slice {
		if v == val {
			return true
		}
	}
	return false
}
