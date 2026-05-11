// Registro de rutas de métricas y filtros del panel operativo.
package metrics

import (
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/operationalsqlc"
)

// Setup registra todos los endpoints de métricas en el grupo de API.
func Setup(rg *gin.RouterGroup, queries *operationalsqlc.Queries) {
	ctrl := NewController(queries)

	m := rg.Group("/metrics")
	{
		m.GET("/appointments", ctrl.Appointments)
		m.GET("/occupancy", ctrl.Occupancy)
		m.GET("/patients", ctrl.Patients)
		m.GET("/revenue", ctrl.Revenue)
		m.GET("/top-doctors", ctrl.TopDoctors)
		m.GET("/cancellation-rate", ctrl.CancellationRate)
		m.GET("/avg-ticket", ctrl.AvgTicket)
		m.GET("/retention-cohorts", ctrl.RetentionCohorts)
	}

	// Filtros para los selectores del frontend
	f := rg.Group("/filters")
	{
		f.GET("/date-range", ctrl.DateRange)
		f.GET("/clinics", ctrl.ListClinics)
		f.GET("/doctors", ctrl.ListDoctors)
		f.GET("/specialties", ctrl.ListSpecialties)
	}
}
