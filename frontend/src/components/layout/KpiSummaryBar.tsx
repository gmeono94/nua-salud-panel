// Barra de KPIs globales clickables (siempre visible arriba)
import { useNavigate } from 'react-router-dom'
import { useMetric } from '../../hooks/useMetric'
import {
  fetchAppointments,
  fetchOccupancy,
  fetchPatients,
  fetchAvgTicket,
  fetchCancellationRate,
  fetchRevenue,
} from '../../services/api'
import type {
  AppointmentsResponse,
  OccupancyResponse,
  PatientsResponse,
  AvgTicketResponse,
  CancellationRateResponse,
  RevenueResponse,
} from '../../types/api'
import { formatMXN } from '../../utils/format'

interface KpiItemProps {
  label: string
  value: string | number
  color: string
  to: string
  loading: boolean
}

function KpiItem({ label, value, color, to, loading }: KpiItemProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(to)}
      className="flex-1 min-w-[140px] bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer text-left"
    >
      {loading ? (
        <div className="h-8 flex items-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </button>
  )
}

export default function KpiSummaryBar() {
  const revenue = useMetric<RevenueResponse>(fetchRevenue, {
    includeFilters: ['clinic_id', 'specialty', 'dates'],
  })

  const appointments = useMetric<AppointmentsResponse>(fetchAppointments, {
    includeFilters: ['clinic_id', 'doctor_id', 'specialty', 'dates'],
  })

  const occupancy = useMetric<OccupancyResponse>(fetchOccupancy, {
    includeFilters: ['clinic_id', 'dates'],
  })

  const patients = useMetric<PatientsResponse>(fetchPatients, {
    includeFilters: ['clinic_id', 'dates'],
  })

  const avgTicket = useMetric<AvgTicketResponse>(fetchAvgTicket, {
    includeFilters: ['clinic_id', 'specialty', 'dates'],
  })

  const cancellation = useMetric<CancellationRateResponse>(
    fetchCancellationRate,
    { includeFilters: ['clinic_id', 'doctor_id', 'specialty', 'dates'] }
  )

  // Calcular ocupación promedio
  const avgOccupancy = (() => {
    if (!occupancy.data?.data || !Array.isArray(occupancy.data.data)) return 0
    const rates = (occupancy.data.data as Array<{ occupancy_rate: number }>).map(
      (d) => d.occupancy_rate
    )
    if (rates.length === 0) return 0
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  })()

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      <KpiItem
        label="Ingreso total"
        value={revenue.data?.total_revenue ? formatMXN(revenue.data.total_revenue) : '—'}
        color="text-emerald-600"
        to="/ingresos"
        loading={revenue.loading}
      />
      <KpiItem
        label="Total citas"
        value={appointments.data?.summary?.total ? appointments.data.summary.total.toLocaleString('es-MX') : '—'}
        color="text-violet-600"
        to="/citas"
        loading={appointments.loading}
      />
      <KpiItem
        label="Ocupación"
        value={avgOccupancy > 0 ? `${avgOccupancy}%` : '—'}
        color="text-indigo-600"
        to="/citas"
        loading={occupancy.loading}
      />
      <KpiItem
        label="Pacientes nuevas"
        value={patients.data?.summary?.new_patients ? patients.data.summary.new_patients.toLocaleString('es-MX') : '—'}
        color="text-violet-600"
        to="/pacientes"
        loading={patients.loading}
      />
      <KpiItem
        label="Ticket promedio"
        value={avgTicket.data?.summary?.avg_ticket ? formatMXN(avgTicket.data.summary.avg_ticket) : '—'}
        color="text-emerald-600"
        to="/ingresos"
        loading={avgTicket.loading}
      />
      <KpiItem
        label="Tasa cancelación"
        value={cancellation.data?.summary?.total ? `${cancellation.data.summary.lost_rate}%` : '—'}
        color="text-rose-600"
        to="/citas"
        loading={cancellation.loading}
      />
    </div>
  )
}
