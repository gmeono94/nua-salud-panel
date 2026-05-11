// Controller de métricas del panel operativo.
package metrics

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/commons/filters"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/operationalsqlc"
)

type Controller struct {
	q *operationalsqlc.Queries
}

func NewController(q *operationalsqlc.Queries) *Controller {
	return &Controller{q: q}
}

// Appointments — M1: Citas por período con desglose por estado.
// GET /api/v1/metrics/appointments?date_from=&date_to=&group_by=month&clinic_id=&doctor_id=&specialty=
func (ctrl *Controller) Appointments(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	groupBy := c.DefaultQuery("group_by", "month")

	params := operationalsqlc.GetAppointmentsByPeriodParams{
		GroupBy:   groupBy,
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  filters.OptionalText(c, "clinic_id"),
		DoctorID:  filters.OptionalText(c, "doctor_id"),
		Specialty: filters.OptionalSpecialty(c, "specialty"),
	}

	data, err := ctrl.q.GetAppointmentsByPeriod(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando citas"})
		return
	}

	summary, err := ctrl.q.GetAppointmentsSummary(c.Request.Context(), operationalsqlc.GetAppointmentsSummaryParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  params.ClinicID,
		DoctorID:  params.DoctorID,
		Specialty: params.Specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando resumen"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
		"data":    data,
	})
}

// Occupancy — M2: Tasa de ocupación por clínica o por doctora.
// GET /api/v1/metrics/occupancy?date_from=&date_to=&clinic_id=&view=clinic|doctor&specialty=
func (ctrl *Controller) Occupancy(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	view := c.DefaultQuery("view", "clinic")

	if view == "doctor" {
		params := operationalsqlc.GetOccupancyByDoctorParams{
			TotalDays: dr.Days,
			ClinicID:  filters.OptionalText(c, "clinic_id"),
			Specialty: filters.OptionalSpecialty(c, "specialty"),
			DateFrom:  dr.From,
			DateTo:    dr.To,
		}
		data, err := ctrl.q.GetOccupancyByDoctor(c.Request.Context(), params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ocupación por doctora"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"view": "doctor", "data": data})
		return
	}

	params := operationalsqlc.GetOccupancyByClinicParams{
		TotalDays: dr.Days,
		ClinicID:  filters.OptionalText(c, "clinic_id"),
		DateFrom:  dr.From,
		DateTo:    dr.To,
	}
	data, err := ctrl.q.GetOccupancyByClinic(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ocupación"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"view": "clinic", "data": data})
}

// Patients — M3: Pacientes nuevas vs recurrentes.
// GET /api/v1/metrics/patients?date_from=&date_to=&clinic_id=
func (ctrl *Controller) Patients(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	clinicID := filters.OptionalText(c, "clinic_id")

	summary, err := ctrl.q.GetNewVsReturning(c.Request.Context(), operationalsqlc.GetNewVsReturningParams{
		DateFrom: dr.From,
		DateTo:   dr.To,
		ClinicID: clinicID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando pacientes"})
		return
	}

	monthly, err := ctrl.q.GetNewVsReturningByMonth(c.Request.Context(), operationalsqlc.GetNewVsReturningByMonthParams{
		DateFrom: dr.From,
		DateTo:   dr.To,
		ClinicID: clinicID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando desglose mensual"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
		"monthly": monthly,
	})
}

// Revenue — M4: Ingresos por clínica desglosados por tipo de servicio.
// GET /api/v1/metrics/revenue?date_from=&date_to=&clinic_id=&specialty=
func (ctrl *Controller) Revenue(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	clinicID := filters.OptionalText(c, "clinic_id")
	specialty := filters.OptionalSpecialty(c, "specialty")

	data, err := ctrl.q.GetRevenueByClinic(c.Request.Context(), operationalsqlc.GetRevenueByClinicParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ingresos"})
		return
	}

	total, err := ctrl.q.GetRevenueSummary(c.Request.Context(), operationalsqlc.GetRevenueSummaryParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando total de ingresos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue": total,
		"data":          data,
	})
}

// TopDoctors — M5: Ranking de doctoras por volumen de citas completadas.
// GET /api/v1/metrics/top-doctors?date_from=&date_to=&clinic_id=&specialty=
func (ctrl *Controller) TopDoctors(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	data, err := ctrl.q.GetTopDoctors(c.Request.Context(), operationalsqlc.GetTopDoctorsParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  filters.OptionalText(c, "clinic_id"),
		Specialty: filters.OptionalSpecialty(c, "specialty"),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando top doctoras"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// CancellationRate — M6: Tasa de cancelación/no-show.
// GET /api/v1/metrics/cancellation-rate?date_from=&date_to=&group_by=month&clinic_id=&doctor_id=&specialty=
func (ctrl *Controller) CancellationRate(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	groupBy := c.DefaultQuery("group_by", "month")
	clinicID := filters.OptionalText(c, "clinic_id")
	doctorID := filters.OptionalText(c, "doctor_id")
	specialty := filters.OptionalSpecialty(c, "specialty")

	data, err := ctrl.q.GetCancellationRateByPeriod(c.Request.Context(), operationalsqlc.GetCancellationRateByPeriodParams{
		GroupBy:   groupBy,
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		DoctorID:  doctorID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando tasa de cancelación"})
		return
	}

	summary, err := ctrl.q.GetCancellationRateSummary(c.Request.Context(), operationalsqlc.GetCancellationRateSummaryParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		DoctorID:  doctorID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando resumen de cancelación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
		"data":    data,
	})
}

// AvgTicket — M7: Ticket promedio por cita completada.
// GET /api/v1/metrics/avg-ticket?date_from=&date_to=&clinic_id=&specialty=
func (ctrl *Controller) AvgTicket(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	clinicID := filters.OptionalText(c, "clinic_id")
	specialty := filters.OptionalSpecialty(c, "specialty")

	summary, err := ctrl.q.GetAvgTicket(c.Request.Context(), operationalsqlc.GetAvgTicketParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ticket promedio"})
		return
	}

	byClinic, err := ctrl.q.GetAvgTicketByClinic(c.Request.Context(), operationalsqlc.GetAvgTicketByClinicParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ticket por clínica"})
		return
	}

	bySpecialty, err := ctrl.q.GetAvgTicketBySpecialty(c.Request.Context(), operationalsqlc.GetAvgTicketBySpecialtyParams{
		DateFrom:  dr.From,
		DateTo:    dr.To,
		ClinicID:  clinicID,
		Specialty: specialty,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando ticket por especialidad"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":      summary,
		"by_clinic":    byClinic,
		"by_specialty": bySpecialty,
	})
}

// RetentionCohorts — M8: Cohortes de retención de pacientes.
// GET /api/v1/metrics/retention-cohorts?date_from=&date_to=&clinic_id=
func (ctrl *Controller) RetentionCohorts(c *gin.Context) {
	dr, err := filters.ParseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from y date_to son requeridos (YYYY-MM-DD)"})
		return
	}

	clinicID := filters.OptionalText(c, "clinic_id")

	cohorts, err := ctrl.q.GetRetentionCohorts(c.Request.Context(), operationalsqlc.GetRetentionCohortsParams{
		DateFrom: dr.From,
		DateTo:   dr.To,
		ClinicID: clinicID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando cohortes de retención"})
		return
	}

	sizes, err := ctrl.q.GetCohortSizes(c.Request.Context(), operationalsqlc.GetCohortSizesParams{
		DateFrom: dr.From,
		DateTo:   dr.To,
		ClinicID: clinicID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error consultando tamaño de cohortes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"cohorts": cohorts,
		"sizes":   sizes,
	})
}

// DateRange — Rango de fechas con datos disponibles.
// GET /api/v1/filters/date-range
func (ctrl *Controller) DateRange(c *gin.Context) {
	row, err := ctrl.q.GetDateRange(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo rango de fechas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"min_date": row.MinDate.Time.Format("2006-01-02"),
		"max_date": row.MaxDate.Time.Format("2006-01-02"),
	})
}

// ListClinics — Clínicas activas para el selector de filtros.
// GET /api/v1/filters/clinics
func (ctrl *Controller) ListClinics(c *gin.Context) {
	data, err := ctrl.q.ListClinics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error listando clínicas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// ListDoctors — Doctoras activas, opcionalmente filtradas por clínica.
// GET /api/v1/filters/doctors?clinic_id=
func (ctrl *Controller) ListDoctors(c *gin.Context) {
	data, err := ctrl.q.ListDoctors(c.Request.Context(), filters.OptionalText(c, "clinic_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error listando doctoras"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// ListSpecialties — Especialidades disponibles.
// GET /api/v1/filters/specialties
func (ctrl *Controller) ListSpecialties(c *gin.Context) {
	data, err := ctrl.q.ListSpecialties(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error listando especialidades"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}
