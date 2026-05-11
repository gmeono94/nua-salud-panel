// Contexto de autenticación: manejo de tokens, login, logout y refresh automático.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  clinic_ids?: number[]
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'nua_auth'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY || ''

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignorar */ }
  return { accessToken: null, refreshToken: null, user: null }
}

function saveToStorage(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)
  const [loading, setLoading] = useState(true)

  // Validar sesión al montar (verificar que el token sigue vigente)
  useEffect(() => {
    const validate = async () => {
      if (!state.accessToken) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'X-API-Key': API_KEY,
          },
        })

        if (res.ok) {
          setLoading(false)
          return
        }

        // Token expirado — intentar refresh
        if (state.refreshToken) {
          const refreshed = await doRefresh(state.refreshToken)
          if (refreshed) {
            setState(refreshed)
            saveToStorage(refreshed)
            setLoading(false)
            return
          }
        }

        // No se pudo validar ni refrescar
        setState({ accessToken: null, refreshToken: null, user: null })
        clearStorage()
      } catch {
        // Error de red — mantener sesión (puede ser problema temporal)
      }
      setLoading(false)
    }

    validate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Credenciales inválidas')
    }

    const data = await res.json()
    const newState: AuthState = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    }
    setState(newState)
    saveToStorage(newState)
  }, [])

  const logout = useCallback(async () => {
    if (state.refreshToken) {
      try {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.accessToken}`,
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify({ refresh_token: state.refreshToken }),
        })
      } catch { /* ignorar errores al cerrar sesión */ }
    }

    setState({ accessToken: null, refreshToken: null, user: null })
    clearStorage()
  }, [state.accessToken, state.refreshToken])

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.refreshToken) return null

    const refreshed = await doRefresh(state.refreshToken)
    if (refreshed) {
      setState(refreshed)
      saveToStorage(refreshed)
      return refreshed.accessToken
    }

    setState({ accessToken: null, refreshToken: null, user: null })
    clearStorage()
    return null
  }, [state.refreshToken])

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: !!state.accessToken,
        loading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Llama al endpoint de refresh y retorna el nuevo estado o null
async function doRefresh(refreshToken: string): Promise<AuthState | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    }
  } catch {
    return null
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
