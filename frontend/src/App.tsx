// Punto de entrada con rutas protegidas, tabs y autenticación
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AuthBridge } from './components/auth/AuthBridge'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { FiltersProvider } from './hooks/useFilters'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import OverviewTab from './pages/tabs/OverviewTab'
import CitasTab from './pages/tabs/CitasTab'
import PacientesTab from './pages/tabs/PacientesTab'
import IngresosTab from './pages/tabs/IngresosTab'
import EquipoTab from './pages/tabs/EquipoTab'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthBridge />
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
            <Route index element={<OverviewTab />} />
            <Route path="citas" element={<CitasTab />} />
            <Route path="pacientes" element={<PacientesTab />} />
            <Route path="ingresos" element={<IngresosTab />} />
            <Route path="equipo" element={<EquipoTab />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
