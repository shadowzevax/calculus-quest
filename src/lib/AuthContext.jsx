// Contexto global de sesión: cualquier componente puede saber quién está
// logueado con el hook useAuth(), sin pasar props manualmente.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Pregunta "¿quién soy?" al cargar la app, para no pedir login si ya hay cookie. También se
  // llama de nuevo despues de completar un ejercicio (para refrescar XP/nivel) — si en ese
  // momento la red falla o algún otro endpoint tiene un error pasajero (no 401), NO hay que
  // cerrar la sesión y perder lo que se estaba jugando: solo un 401 real (cookie inválida o
  // vencida) significa que de verdad ya no hay sesión.
  const refresh = useCallback(async () => {
    try {
      const { user } = await api.auth.me()
      setUser(user)
    } catch (err) {
      if (err?.status === 401) setUser(null)
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
    <AuthContext.Provider value={{ user, setUser, isLoadingAuth, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
