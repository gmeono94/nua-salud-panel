// Contenedor de gráfica con título, acciones opcionales y estados de carga/error
import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  actions?: ReactNode
  children: ReactNode
  loading?: boolean
  error?: string | null
  delay?: number
  className?: string
}

export default function ChartCard({
  title,
  actions,
  children,
  loading = false,
  error = null,
  delay = 0,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`animate-fade-in bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)] p-6 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Encabezado con título y acciones */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Estado de error */}
      {error && !loading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {/* Contenido */}
      {!loading && !error && children}
    </div>
  )
}
