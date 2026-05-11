// Header del dashboard con logo, título e info del usuario autenticado
import { useAuth } from '../../hooks/useAuth'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administradora',
  strategy: 'Estrategia',
  clinic_director: 'Directora de Clínica',
}

export default function Header() {
  const { user, logout } = useAuth()

  const roleName = user ? ROLE_LABELS[user.role] || user.role : ''
  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  return (
    <header className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] border-b border-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Marca */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-800 tracking-tight">
            Nua Salud
          </span>
        </div>

        {/* Título central */}
        <h1 className="text-sm font-medium text-gray-500 hidden md:block">
          Panel Operativo
        </h1>

        {/* Info de usuario + logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-700 leading-none">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{roleName}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-semibold text-violet-600">
            {initials || (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
