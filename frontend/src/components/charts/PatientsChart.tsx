// M3 - Pacientes: donut (nuevas vs recurrentes) + área de evolución mensual
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fetchPatients } from '../../services/api'
import type { PatientsResponse } from '../../types/api'
import { useMetric } from '../../hooks/useMetric'
import ChartCard from '../ui/ChartCard'

// Colores del donut
const COLORS = ['#7c3aed', '#4f46e5']

// Tooltip para la mini área
function MiniTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <p className="font-medium text-gray-600 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  mini?: boolean
}

export default function PatientsChart({ mini }: Props) {
  const { data, loading, error } = useMetric<PatientsResponse>(fetchPatients, {
    includeFilters: ['clinic_id', 'dates'],
  })

  // Datos para el donut
  const donutData = data?.summary
    ? [
        { name: 'Nuevas', value: data.summary.new_patients },
        { name: 'Recurrentes', value: data.summary.returning_patients },
      ]
    : []

  return (
    <ChartCard title="Pacientes" delay={300} loading={loading} error={error}>
      {!data?.summary || data.summary.total_patients === 0 ? (
        !loading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Sin datos de pacientes
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Donut con total en el centro */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <PieChart width={200} height={200}>
                <Pie
                  data={donutData}
                  cx={100}
                  cy={100}
                  innerRadius={62}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {donutData.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
              {/* Número total en el centro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">
                  {data.summary.total_patients}
                </span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          {!mini && (
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600" />
                <span className="text-sm text-gray-600">
                  Nuevas ({data.summary.new_patients})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-sm text-gray-600">
                  Recurrentes ({data.summary.returning_patients})
                </span>
              </div>
            </div>
          )}

          {/* Mini área: evolución mensual */}
          {!mini && data.monthly && data.monthly.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Evolución mensual
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={data.monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradReturning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip content={<MiniTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="new_patients"
                    name="Nuevas"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#gradNew)"
                  />
                  <Area
                    type="monotone"
                    dataKey="returning_patients"
                    name="Recurrentes"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#gradReturning)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  )
}
