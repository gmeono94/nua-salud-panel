// M4 - Ingresos: KPI total + barras horizontales apiladas por especialidad
import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { fetchRevenue } from '../../services/api'
import type { RevenueResponse } from '../../types/api'
import { useMetric } from '../../hooks/useMetric'
import { SPECIALTY_HEX } from '../../constants/colors'
import ChartCard from '../ui/ChartCard'
import KpiCard from '../ui/KpiCard'

// Icono de moneda
function DollarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

// Formatea valor como moneda MXN
function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Tooltip personalizado
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-800">{formatMXN(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  mini?: boolean
}

function RevenueChart({ mini }: Props) {
  const { data, loading, error } = useMetric<RevenueResponse>(fetchRevenue, {
    includeFilters: ['clinic_id', 'specialty', 'dates'],
  })

  // Transformar datos: agrupar por clínica, con una columna por especialidad
  const chartData = useMemo(() => {
    if (!data?.data) return []

    // Mapa: clinic_id -> { clinic_name, ginecologia, obstetricia, menopausia }
    const clinicMap = new Map<string, { clinic_name: string; [key: string]: string | number }>()

    data.data.forEach((item) => {
      if (!clinicMap.has(item.clinic_id)) {
        clinicMap.set(item.clinic_id, {
          clinic_name: item.clinic_name,
          ginecologia: 0,
          obstetricia: 0,
          menopausia: 0,
        })
      }
      const clinic = clinicMap.get(item.clinic_id)!
      const current = clinic[item.service_specialty]
      clinic[item.service_specialty] = (typeof current === 'number' ? current : 0) + item.revenue
    })

    return Array.from(clinicMap.values())
  }, [data])

  // Especialidades presentes en los datos
  const specialties = useMemo(() => {
    if (!data?.data) return []
    return [...new Set(data.data.map((d) => d.service_specialty))]
  }, [data])

  return (
    <div className={mini ? '' : 'space-y-4'}>
      {!mini && data && data.total_revenue > 0 && (
        <KpiCard
          label="Ingreso total"
          value={formatMXN(data.total_revenue)}
          icon={<DollarIcon />}
          color="text-violet-600"
          delay={200}
        />
      )}

      <ChartCard
        title={mini ? 'Ingresos' : 'Ingresos por clínica y especialidad'}
        subtitle={mini && data ? formatMXN(data.total_revenue) : undefined}
        compact={mini}
        delay={300}
        loading={loading}
        error={error}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={mini ? 150 : Math.max(200, chartData.length * 60)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatMXN(v)}
                hide={mini}
              />
              <YAxis
                type="category"
                dataKey="clinic_name"
                tick={{ fontSize: mini ? 11 : 13, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={mini ? 70 : 100}
              />
              {!mini && <Tooltip content={<RevenueTooltip />} />}
              {!mini && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600 capitalize">{value}</span>
                  )}
                />
              )}
              {specialties.map((sp) => (
                <Bar
                  key={sp}
                  dataKey={sp}
                  name={sp}
                  stackId="revenue"
                  fill={SPECIALTY_HEX[sp] || '#94a3b8'}
                  radius={specialties.indexOf(sp) === specialties.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]}
                  barSize={24}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Sin datos de ingresos
          </div>
        )}
      </ChartCard>
    </div>
  )
}

export default memo(RevenueChart)
