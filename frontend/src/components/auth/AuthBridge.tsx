// Conecta el contexto de auth con el cliente HTTP (evita dependencia circular)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { setAuthHelpers } from '../../services/api'

export function AuthBridge() {
  const { accessToken, refreshAccessToken, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setAuthHelpers({
      getToken: () => accessToken,
      refresh: refreshAccessToken,
      onUnauth: () => {
        logout()
        navigate('/login', { replace: true })
      },
    })
  }, [accessToken, refreshAccessToken, logout, navigate])

  return null
}
