// M8: Tabla heatmap de cohortes de retención
import { useMemo } from 'react'
import { useMetric } from '../../hooks/useMetric'
import { fetchRetentionCohorts } from '../../services/api'
import type { RetentionCohortsResponse } from '../../types/api'
import ChartCard from '../ui/ChartCard'

interface Props {
  mini?: boolean
}

export default function RetentionCohortsChart({ mini }: Props) {
  const { data, loading, error } = useMetric<RetentionCohortsResponse>(
    fetchRetentionCohorts,
    { includeFilters: ['clinic_id', 'dates'] }
  )

  // Construir la matriz: filas = cohortes, columnas = offsets
  const { rows, maxOffset } = useMemo(() => {
    if (!data) return { rows: [], maxOffset: 0 }

    const sizeMap = new Map(data.sizes.map((s) => [s.cohort, s.cohort_size]))
    const matrix = new Map<string, Map<number, number>>()
    let max = 0

    for (const c of data.cohorts) {
      if (!matrix.has(c.cohort)) matrix.set(c.cohort, new Map())
      matrix.get(c.cohort)!.set(c.month_offset, c.active_patients)
      if (c.month_offset > max) max = c.month_offset
    }

    const rows = Array.from(matrix.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohort, offsets]) => {
        const size = sizeMap.get(cohort) || 1
        const cells: number[] = []
        for (let i = 0; i <= max; i++) {
          const active = offsets.get(i) || 0
          cells.push(Math.round((active / size) * 100))
        }
        return { cohort, size, cells }
      })

    return { rows, maxOffset: max }
  }, [data])

  // Intensidad de color según porcentaje de retención
  const cellColor = (pct: number) => {
    if (pct === 0) return 'bg-gray-50 text-gray-300'
    if (pct >= 80) return 'bg-violet-600 text-white'
    if (pct >= 60) return 'bg-violet-500 text-white'
    if (pct >= 40) return 'bg-violet-400 text-white'
    if (pct >= 20) return 'bg-violet-200 text-violet-700'
    return 'bg-violet-100 text-violet-600'
  }

  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i)

  return (
    <ChartCard title="Retención de pacientes" loading={loading} error={error}>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Sin datos de retención para el período seleccionado
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-3">
                  Cohorte
                </th>
                <th className="text-center text-xs font-medium text-gray-400 pb-2 px-1">
                  N
                </th>
                {offsets.map((o) => (
                  <th
                    key={o}
                    className="text-center text-xs font-medium text-gray-400 pb-2 px-1"
                  >
                    {mini ? `+${o}` : `Mes +${o}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.cohort}>
                  <td className="text-xs font-medium text-gray-600 py-1 pr-3 whitespace-nowrap">
                    {row.cohort}
                  </td>
                  <td className="text-center text-xs text-gray-500 py-1 px-1">
                    {row.size}
                  </td>
                  {row.cells.map((pct, i) => (
                    <td key={i} className="py-1 px-1">
                      <div
                        className={`rounded-md text-center text-xs font-medium py-1.5 px-2 ${cellColor(pct)}`}
                      >
                        {pct}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  )
}
