// M6: Tasa de cancelación/no-show por período
import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useMetric } from '../../hooks/useMetric'
import { fetchCancellationRate } from '../../services/api'
import type { CancellationRateResponse } from '../../types/api'
import ChartCard from '../ui/ChartCard'

interface Props {
  mini?: boolean
}

export default function CancellationRateChart({ mini }: Props) {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month')

  const { data, loading, error } = useMetric<CancellationRateResponse>(
    fetchCancellationRate,
    {
      extraParams: { group_by: groupBy },
      includeFilters: ['clinic_id', 'doctor_id', 'specialty', 'dates'],
    }
  )

  const groups: Array<{ value: 'day' | 'week' | 'month'; label: string }> = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ]

  return (
    <ChartCard
      title="Tasa de cancelación"
      loading={loading}
      error={error}
      actions={
        !mini ? (
          <div className="flex gap-1">
            {groups.map((g) => (
              <button
                key={g.value}
                onClick={() => setGroupBy(g.value)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  groupBy === g.value
                    ? 'bg-rose-50 text-rose-600 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {!mini && data?.summary && data.summary.total > 0 && (
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <span className="text-gray-400">Tasa global</span>
            <span className="ml-2 text-lg font-semibold text-rose-600">
              {data.summary.lost_rate}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">Canceladas</span>
            <span className="ml-2 font-medium text-gray-700">
              {data.summary.cancelled}
            </span>
          </div>
          <div>
            <span className="text-gray-400">No asistieron</span>
            <span className="ml-2 font-medium text-gray-700">
              {data.summary.no_show}
            </span>
          </div>
        </div>
      )}

      {!loading && (!data?.data || data.data.length === 0) ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
          Sin datos de cancelaciones
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={mini ? 160 : 280}>
          <LineChart data={data?.data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
              unit="%"
              domain={[0, 'auto']}
            />
            {!mini && (
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                formatter={(value) => [`${value}%`, 'Tasa de pérdida']}
              />
            )}
            <Line
              type="monotone"
              dataKey="lost_rate"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f43f5e' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
