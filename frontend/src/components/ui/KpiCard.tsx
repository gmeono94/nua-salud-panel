// Tarjeta de KPI con icono, valor y etiqueta
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color?: string // clase de Tailwind para el color de acento
  delay?: number
}

export default function KpiCard({
  label,
  value,
  icon,
  color = 'text-violet-600',
  delay = 0,
}: KpiCardProps) {
  return (
    <div
      className="animate-fade-in bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)] flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icono con fondo suave */}
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-violet-50`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-gray-900 tracking-tight leading-none">
          {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}
