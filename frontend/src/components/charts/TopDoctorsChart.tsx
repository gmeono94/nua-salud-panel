// M5 - Top Doctoras: leaderboard con tarjetas, badges y barras de progreso
import { fetchTopDoctors } from '../../services/api'
import type { TopDoctorsResponse } from '../../types/api'
import { useMetric } from '../../hooks/useMetric'
import ChartCard from '../ui/ChartCard'

// Colores de especialidad
const SPECIALTY_COLORS: Record<string, { bg: string; text: string }> = {
  ginecologia: { bg: 'bg-violet-100', text: 'text-violet-700' },
  obstetricia: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  menopausia: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

// Estilos para las medallas del top 3
const MEDAL_STYLES: Record<number, { bg: string; text: string; ring: string }> = {
  0: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
  1: { bg: 'bg-gray-50', text: 'text-gray-500', ring: 'ring-gray-200' },
  2: { bg: 'bg-orange-50', text: 'text-orange-500', ring: 'ring-orange-200' },
}

// Iconos de medalla (1ro, 2do, 3ro)
const MEDAL_ICONS = ['🥇', '🥈', '🥉']

interface Props {
  mini?: boolean
}

export default function TopDoctorsChart({ mini }: Props) {
  const { data, loading, error } = useMetric<TopDoctorsResponse>(
    fetchTopDoctors,
    { includeFilters: ['clinic_id', 'specialty', 'dates'] }
  )

  const allDoctors = data?.data || []
  const doctors = mini ? allDoctors.slice(0, 5) : allDoctors
  const maxAppointments = allDoctors.length > 0 ? allDoctors[0].completed_appointments : 1

  return (
    <ChartCard title="Top Doctoras" delay={400} loading={loading} error={error}>
      {doctors.length > 0 ? (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {doctors.map((doc, index) => {
            const medal = MEDAL_STYLES[index]
            const specColors = SPECIALTY_COLORS[doc.specialty] || {
              bg: 'bg-gray-100',
              text: 'text-gray-700',
            }
            const progressPct =
              (doc.completed_appointments / maxAppointments) * 100

            return (
              <div
                key={doc.doctor_id}
                className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors ${
                  medal ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'
                }`}
              >
                {/* Posición / Medalla */}
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    medal
                      ? `${medal.bg} ${medal.text} ring-1 ${medal.ring}`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < 3 ? MEDAL_ICONS[index] : index + 1}
                </div>

                {/* Info de la doctora */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800 truncate">
                      {doc.doctor_name}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${specColors.bg} ${specColors.text}`}
                    >
                      {doc.specialty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1.5">{doc.clinic_name}</p>

                  {/* Barra de progreso */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Número de citas */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-lg font-bold text-gray-800">
                    {doc.completed_appointments}
                  </span>
                  <p className="text-[10px] text-gray-400">citas</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
          Sin datos de doctoras
        </div>
      )}
    </ChartCard>
  )
}
