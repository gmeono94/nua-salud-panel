// Punto de entrada con rutas protegidas, tabs y autenticación
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AuthBridge } from './components/auth/AuthBridge'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { FiltersProvider } from './hooks/useFilters'
import DashboardLayout from './components/layout/DashboardLayout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'

const OverviewTab = lazy(() => import('./pages/tabs/OverviewTab'))
const CitasTab = lazy(() => import('./pages/tabs/CitasTab'))
const PacientesTab = lazy(() => import('./pages/tabs/PacientesTab'))
const IngresosTab = lazy(() => import('./pages/tabs/IngresosTab'))
const EquipoTab = lazy(() => import('./pages/tabs/EquipoTab'))

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthBridge />
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <FiltersProvider>
                    <DashboardLayout />
                  </FiltersProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<TabFallback />}><OverviewTab /></Suspense>} />
              <Route path="citas" element={<Suspense fallback={<TabFallback />}><CitasTab /></Suspense>} />
              <Route path="pacientes" element={<Suspense fallback={<TabFallback />}><PacientesTab /></Suspense>} />
              <Route path="ingresos" element={<Suspense fallback={<TabFallback />}><IngresosTab /></Suspense>} />
              <Route path="equipo" element={<Suspense fallback={<TabFallback />}><EquipoTab /></Suspense>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
