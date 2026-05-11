// Punto de entrada con rutas protegidas y autenticación
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AuthBridge } from './components/auth/AuthBridge'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { FiltersProvider } from './hooks/useFilters'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthBridge />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FiltersProvider>
                  <Dashboard />
                </FiltersProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
