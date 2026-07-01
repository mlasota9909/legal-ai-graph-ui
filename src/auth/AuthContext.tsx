import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'legal_ai_token'
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true'

interface AuthContextValue {
  token: string | null
  login: (t: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (AUTH_DISABLED) return 'dev'
    return localStorage.getItem(STORAGE_KEY)
  })

  const login = useCallback((t: string) => {
    if (AUTH_DISABLED) return
    localStorage.setItem(STORAGE_KEY, t)
    setToken(t)
  }, [])

  const logout = useCallback(() => {
    if (AUTH_DISABLED) return
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({
      token: AUTH_DISABLED ? 'dev' : token,
      login,
      logout,
    }),
    [token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
