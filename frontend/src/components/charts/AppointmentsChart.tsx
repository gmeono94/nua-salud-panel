// M1 - Gráfica de citas: KPIs + área apilada con gradientes
import { memo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useMetric } from '../../hooks/useMetric'
import { useFilters } from '../../hooks/useFilters'
import { fetchAppointments } from '../../services/api'
import type { AppointmentsResponse } from '../../types/api'
import ChartCard from '../ui/ChartCard'
import KpiCard from '../ui/KpiCard'

// Iconos SVG inline para las KPIs
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  )
}

// Tooltip personalizado para el área chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-800">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  mini?: boolean
}

function AppointmentsChart({ mini }: Props) {
  const { filters, setFilter } = useFilters()
  const { data, loading, error } = useMetric<AppointmentsResponse>(
    fetchAppointments,
    { includeFilters: ['clinic_id', 'doctor_id', 'specialty', 'dates', 'group_by'] }
  )

  // Opciones de agrupación temporal
  const groupOptions: { value: 'day' | 'week' | 'month'; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs superiores */}
      {!mini && data?.summary && data.summary.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total citas" value={data.summary.total} icon={<CalendarIcon />} color="text-violet-600" delay={0} />
          <KpiCard label="Completadas" value={data.summary.completed} icon={<CheckIcon />} color="text-emerald-600" delay={100} />
          <KpiCard label="Canceladas" value={data.summary.cancelled} icon={<XCircleIcon />} color="text-amber-600" delay={200} />
          <KpiCard label="No asistieron" value={data.summary.no_show} icon={<AlertIcon />} color="text-rose-600" delay={300} />
        </div>
      )}

      {/* Gráfica de área */}
      <ChartCard
        title="Citas por periodo"
        subtitle={mini && data?.summary ? data.summary.total.toLocaleString('es-MX') + ' citas' : undefined}
        compact={mini}
        delay={200}
        loading={loading}
        error={error}
        actions={
          !mini ? (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {groupOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('group_by', opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    filters.group_by === opt.value
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {data?.data && data.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={mini ? 150 : 320}>
            <AreaChart data={data.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradNoShow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completadas"
                stackId="1"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#gradCompleted)"
              />
              <Area
                type="monotone"
                dataKey="cancelled"
                name="Canceladas"
                stackId="1"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gradCancelled)"
              />
              <Area
                type="monotone"
                dataKey="no_show"
                name="No asistieron"
                stackId="1"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#gradNoShow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Sin datos para el periodo seleccionado
          </div>
        )}
      </ChartCard>
    </div>
  )
}

export default memo(AppointmentsChart)
