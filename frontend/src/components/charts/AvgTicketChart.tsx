// M7: Ticket promedio por cita completada
import { memo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useMetric } from '../../hooks/useMetric'
import { fetchAvgTicket } from '../../services/api'
import type { AvgTicketResponse } from '../../types/api'
import { formatMXN } from '../../utils/format'
import { SPECIALTY_HEX } from '../../constants/colors'
import ChartCard from '../ui/ChartCard'

interface Props {
  mini?: boolean
}

function AvgTicketChart({ mini }: Props) {
  const { data, loading, error } = useMetric<AvgTicketResponse>(
    fetchAvgTicket,
    { includeFilters: ['clinic_id', 'specialty', 'dates'] }
  )

  return (
    <ChartCard title="Ticket promedio" loading={loading} error={error}>
      {!mini && data?.summary && data.summary.paid_appointments > 0 && (
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <span className="text-gray-400">Promedio</span>
            <span className="ml-2 text-lg font-semibold text-violet-600">
              {formatMXN(data.summary.avg_ticket)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Citas pagadas</span>
            <span className="ml-2 font-medium text-gray-700">
              {data.summary.paid_appointments}
            </span>
          </div>
        </div>
      )}

      {!loading && (!data?.by_clinic || data.by_clinic.length === 0) ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
          Sin datos de ticket promedio
        </div>
      ) : (
        <>
          {/* Por clínica */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Por clínica
          </p>
          <ResponsiveContainer width="100%" height={mini ? 140 : 200}>
            <BarChart
              data={data?.by_clinic ?? []}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatMXN(v)}
              />
              <YAxis
                type="category"
                dataKey="clinic_name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              {!mini && (
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value) => [formatMXN(value as number), 'Ticket promedio']}
                />
              )}
              <Bar
                dataKey="avg_ticket"
                fill="#7c3aed"
                radius={[0, 6, 6, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Por especialidad */}
          {!mini && data?.by_specialty && data.by_specialty.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-4 mb-2">
                Por especialidad
              </p>
              <div className="flex gap-4">
                {data.by_specialty.map((s) => (
                  <div
                    key={s.specialty}
                    className="flex-1 rounded-xl p-3 bg-gray-50 text-center"
                  >
                    <p className="text-lg font-semibold" style={{ color: SPECIALTY_HEX[s.specialty] || '#7c3aed' }}>
                      {formatMXN(s.avg_ticket)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {s.specialty}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </ChartCard>
  )
}

export default memo(AvgTicketChart)
