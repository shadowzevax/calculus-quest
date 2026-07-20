import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

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
