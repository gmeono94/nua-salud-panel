// Navegación por tabs del dashboard
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/citas', label: 'Citas' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/ingresos', label: 'Ingresos' },
  { to: '/equipo', label: 'Equipo' },
]

export default function TabNavigation() {
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium transition-colors relative ${
              isActive
                ? 'text-violet-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full'
                : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
