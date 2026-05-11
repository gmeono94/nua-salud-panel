// Selector de rango de fechas con presets rápidos
import { useFilters } from '../../hooks/useFilters'
import type { DatePreset } from '../../hooks/useFilters'

// Presets disponibles con sus etiquetas
const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'this_week', label: 'Esta semana' },
  { key: 'this_month', label: 'Este mes' },
  { key: 'last_3_months', label: 'Últimos 3 meses' },
]

export default function DateRangePicker() {
  const { filters, setFilter, setDatePreset, activePreset } = useFilters()

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Periodo
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Botones de presets */}
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setDatePreset(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activePreset === p.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Separador */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Inputs de fecha manual */}
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilter('date_from', e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilter('date_to', e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
        />
      </div>
    </div>
  )
}
