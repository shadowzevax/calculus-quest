// ============================================================================
// Contexto global de autenticación. Envuelve toda la app (ver App.jsx) para
// que CUALQUIER componente pueda saber "¿hay un usuario logueado? ¿quién es?"
// llamando al hook useAuth(), sin tener que pasar esa info a mano por props
// de componente en componente (esto se llama "prop drilling" y es justo lo
// que un Context de React evita).
// ============================================================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Pregunta al backend "¿quién soy?" usando la cookie de sesión.
  // Se llama automáticamente al cargar la app (ver useEffect abajo) para
  // que, si ya había una sesión (cookie guardada de una visita anterior),
  // el usuario no tenga que loguearse de nuevo cada vez que abre la página.
  const refresh = useCallback(async () => {
    try {
      const { user } = await api.auth.me()
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setIsLoadingAuth(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (email, password) => {
    const { user } = await api.auth.login(email, password)
    setUser(user)
    return user
  }

  const register = async (data) => {
    const { user } = await api.auth.register(data)
    setUser(user)
    return user
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
