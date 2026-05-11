// Tipos de respuesta del API de Nua Salud

// --- Filtros ---

export interface Clinic {
  id: string
  name: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  clinic_id: string
}

// --- Citas (M1) ---

export interface AppointmentsSummary {
  total: number
  completed: number
  cancelled: number
  no_show: number
}

export interface AppointmentsPeriod {
  period: string
  completed: number
  cancelled: number
  no_show: number
  total: number
}

export interface AppointmentsResponse {
  summary: AppointmentsSummary
  data: AppointmentsPeriod[]
}

// --- Ocupación (M2) ---

export interface OccupancyClinic {
  clinic_id: string
  clinic_name: string
  available_slots: number
  booked_slots: number
  occupancy_rate: number
}

export interface OccupancyDoctor {
  doctor_id: string
  doctor_name: string
  specialty: string
  clinic_id: string
  clinic_name: string
  available_slots: number
  booked_slots: number
  occupancy_rate: number
}

export interface OccupancyResponse {
  view: 'clinic' | 'doctor'
  data: OccupancyClinic[] | OccupancyDoctor[]
}

// --- Pacientes (M3) ---

export interface PatientsSummary {
  new_patients: number
  returning_patients: number
  total_patients: number
}

export interface PatientsMonthly {
  month: string
  new_patients: number
  returning_patients: number
}

export interface PatientsResponse {
  summary: PatientsSummary
  monthly: PatientsMonthly[]
}

// --- Ingresos (M4) ---

export interface RevenueItem {
  clinic_id: string
  clinic_name: string
  service_specialty: string
  revenue: number
}

export interface RevenueResponse {
  total_revenue: number
  data: RevenueItem[]
}

// --- Top Doctoras (M5) ---

export interface TopDoctor {
  doctor_id: string
  doctor_name: string
  specialty: string
  clinic_name: string
  completed_appointments: number
}

export interface TopDoctorsResponse {
  data: TopDoctor[]
}

// --- Tasa de cancelación (M6) ---

export interface CancellationRatePeriod {
  period: string
  total: number
  lost: number
  lost_rate: number
}

export interface CancellationRateSummary {
  total: number
  cancelled: number
  no_show: number
  lost_rate: number
}

export interface CancellationRateResponse {
  summary: CancellationRateSummary
  data: CancellationRatePeriod[]
}

// --- Ticket promedio (M7) ---

export interface AvgTicketSummary {
  avg_ticket: number
  paid_appointments: number
  total_revenue: number
}

export interface AvgTicketByClinic {
  clinic_id: string
  clinic_name: string
  avg_ticket: number
  paid_appointments: number
}

export interface AvgTicketBySpecialty {
  specialty: string
  avg_ticket: number
  paid_appointments: number
}

export interface AvgTicketResponse {
  summary: AvgTicketSummary
  by_clinic: AvgTicketByClinic[]
  by_specialty: AvgTicketBySpecialty[]
}

// --- Cohortes de retención (M8) ---

export interface CohortRetention {
  cohort: string
  month_offset: number
  active_patients: number
}

export interface CohortSize {
  cohort: string
  cohort_size: number
}

export interface RetentionCohortsResponse {
  cohorts: CohortRetention[]
  sizes: CohortSize[]
}

// --- Filtros globales ---

export interface GlobalFilterValues {
  clinic_id: string
  doctor_id: string
  specialty: string
  date_from: string
  date_to: string
  group_by: 'day' | 'week' | 'month'
}
