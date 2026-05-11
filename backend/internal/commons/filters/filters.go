// Filtros globales compartidos entre todos los endpoints de métricas.
package filters

import "time"

// GlobalFilters representa los filtros que el usuario puede aplicar
// desde el dashboard y que afectan a todas las métricas simultáneamente.
type GlobalFilters struct {
	ClinicIDs   []int      `form:"clinic_ids"`   // IDs de clínicas (selección múltiple)
	StartDate   *time.Time `form:"start_date"`   // Inicio del rango de fechas
	EndDate     *time.Time `form:"end_date"`     // Fin del rango de fechas
	DoctorID    *int       `form:"doctor_id"`    // ID de doctora específica
	Specialty   *string    `form:"specialty"`     // Especialidad médica
	ServiceType *string    `form:"service_type"`  // Tipo de servicio (para ingresos)
}
