// Selector multi-opción con checkboxes y chips para valores seleccionados
import { useState, useRef, useEffect } from 'react'

interface MultiSelectFilterProps {
  label: string
  /** Valores seleccionados (IDs) */
  value: string[]
  onChange: (value: string[]) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function MultiSelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder = 'Todas',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  const clearAll = () => onChange([])

  // Texto del botón principal
  const displayText = () => {
    if (value.length === 0) return placeholder
    if (value.length === 1) {
      const opt = options.find((o) => o.value === value[0])
      return opt?.label ?? value[0]
    }
    return `${value.length} seleccionadas`
  }

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </label>

      {/* Botón que abre el dropdown */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          appearance-none bg-white border rounded-lg px-3 py-2 text-sm text-left
          focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
          transition-colors cursor-pointer pr-8 min-w-[180px]
          ${value.length > 0
            ? 'border-violet-300 text-violet-700'
            : 'border-gray-200 text-gray-700'
          }
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {displayText()}
      </button>

      {/* Dropdown con checkboxes */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[220px] py-1 max-h-64 overflow-y-auto">
          {/* Opción para limpiar selección */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full text-left px-3 py-1.5 text-xs text-violet-600 hover:bg-violet-50 transition-colors font-medium"
            >
              Limpiar selección
            </button>
          )}

          {options.map((opt) => {
            const checked = value.includes(opt.value)
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/30 h-3.5 w-3.5"
                />
                <span className="text-sm text-gray-700 truncate">{opt.label}</span>
              </label>
            )
          })}

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">Sin opciones</div>
          )}
        </div>
      )}
    </div>
  )
}
