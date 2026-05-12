// M2 - Ocupación: vista dual (barras por clínica / anillos por doctora)
import { memo, useState, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { fetchOccupancy } from '../../services/api'
import type { OccupancyResponse, OccupancyClinic, OccupancyDoctor } from '../../types/api'
import { useMetric } from '../../hooks/useMetric'
import { SPECIALTY_CHIPS } from '../../constants/colors'
import ChartCard from '../ui/ChartCard'

type OccupancyView = 'clinic' | 'doctor'

// Indicador circular de progreso (anillo SVG)
function RingProgress({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(percentage, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  // Color según nivel de ocupación
  const color =
    progress >= 80 ? '#7c3aed' : progress >= 50 ? '#4f46e5' : '#a78bfa'

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Anillo de fondo */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {/* Anillo de progreso */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

// Tooltip para las barras
function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: OccupancyClinic }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm">
      <p className="font-medium text-gray-700">{d.clinic_name}</p>
      <p className="text-gray-500">Ocupados: {d.booked_slots} / {d.available_slots}</p>
      <p className="font-medium text-violet-600">{d.occupancy_rate.toFixed(1)}%</p>
    </div>
  )
}

interface Props {
  mini?: boolean
}

function OccupancyChart({ mini }: Props) {
  const [view, setView] = useState<OccupancyView>('clinic')

  // Fetcher que incluye la vista seleccionada
  const fetcher = useCallback(
    (params: Record<string, string>) =>
      fetchOccupancy({ ...params, view }),
    [view]
  )

  const { data, loading, error } = useMetric<OccupancyResponse>(fetcher, {
    includeFilters: ['clinic_id', 'specialty', 'dates'],
    extraParams: { view },
  })

  // Separar datos según la vista
  const clinicData = useMemo(() => {
    if (!data || data.view !== 'clinic') return []
    const clinics = data.data as OccupancyClinic[]
    const hasBookings = clinics.some((c) => c.booked_slots > 0)
    return hasBookings ? clinics : []
  }, [data])

  const doctorData = useMemo(() => {
    if (!data || data.view !== 'doctor') return []
    const doctors = data.data as OccupancyDoctor[]
    const hasBookings = doctors.some((d) => d.booked_slots > 0)
    return hasBookings ? doctors : []
  }, [data])

  return (
    <ChartCard
      title="Ocupación"
      delay={300}
      loading={loading}
      error={error}
      actions={
        !mini ? (
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('clinic')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              view === 'clinic'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Clínica
          </button>
          <button
            onClick={() => setView('doctor')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              view === 'doctor'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Doctora
          </button>
        </div>
        ) : undefined
      }
    >
      {/* Vista por clínica: barras horizontales */}
      {view === 'clinic' && clinicData.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(200, clinicData.length * 56)}>
          <BarChart
            data={clinicData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="clinic_name"
              tick={{ fontSize: 13, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<BarTooltip />} />
            <ReferenceLine
              x={80}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: '80%', position: 'top', fill: '#9ca3af', fontSize: 11 }}
            />
            <Bar dataKey="occupancy_rate" radius={[0, 6, 6, 0]} barSize={24}>
              {clinicData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={`url(#barGrad-${index})`}
                />
              ))}
            </Bar>
            <defs>
              {clinicData.map((_, index) => (
                <linearGradient key={index} id={`barGrad-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Vista por doctora: tarjetas con anillo */}
      {view === 'doctor' && doctorData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {doctorData.map((doc) => {
            const colors = SPECIALTY_CHIPS[doc.specialty] || { bg: 'bg-gray-100', text: 'text-gray-700' }
            return (
              <div
                key={doc.doctor_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors"
              >
                {/* Anillo de progreso */}
                <div className="relative flex-shrink-0">
                  <RingProgress percentage={doc.occupancy_rate} size={64} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-800">
                    {doc.occupancy_rate.toFixed(0)}%
                  </span>
                </div>
                {/* Info */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {doc.doctor_name}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${colors.bg} ${colors.text}`}
                  >
                    {doc.specialty}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.clinic_name}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sin datos */}
      {((view === 'clinic' && clinicData.length === 0) ||
        (view === 'doctor' && doctorData.length === 0)) &&
        !loading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Sin datos de ocupación
          </div>
        )}
    </ChartCard>
  )
}

export default memo(OccupancyChart)
