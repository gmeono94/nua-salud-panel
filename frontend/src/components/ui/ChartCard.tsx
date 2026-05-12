// Contenedor de gráfica con título, acciones opcionales y estados de carga/error
import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  loading?: boolean
  error?: string | null
  delay?: number
  className?: string
  compact?: boolean
}

export default function ChartCard({
  title,
  subtitle,
  actions,
  children,
  loading = false,
  error = null,
  delay = 0,
  className = '',
  compact = false,
}: ChartCardProps) {
  return (
    <div
      className={`animate-fade-in bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)] flex-1 flex flex-col ${compact ? 'p-5' : 'p-6'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
        <div className="min-w-0">
          <h3 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
          {subtitle && <p className={`font-bold ${compact ? 'text-lg' : 'text-xl'} text-gray-900 leading-tight`}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading && (
        <div className={`flex items-center justify-center flex-1 ${compact ? 'py-8' : 'py-16'}`}>
          <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className={`flex items-center justify-center flex-1 ${compact ? 'py-8' : 'py-16'}`}>
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {!loading && !error && <div className="flex-1 min-h-0">{children}</div>}
    </div>
  )
}
