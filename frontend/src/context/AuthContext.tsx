import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, setToken, getToken } from '../api'
import type { User } from '../types'
import { getSavedLanguage, setLanguage, type LanguageCode } from '../i18n'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { full_name: string; email: string; password: string; phone?: string; location?: string }) => Promise<User>
  logout: () => void
  setUser: (u: User | null) => void
  language: LanguageCode
  changeLanguage: (l: LanguageCode) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken())
  const [loading, setLoading] = useState(true)
  const [language, setLangState] = useState<LanguageCode>(getSavedLanguage())

  const changeLanguage = (l: LanguageCode) => {
    setLangState(l)
    setLanguage(l)
    // Persist to backend when logged in
    const token = getToken()
    if (token) {
      authApi.updateLanguage(l).catch(() => {})
    }
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const token = getToken()
    if (token) {
      authApi
        .me()
        .then((u) => {
          setUser(u)
          if (u.role === 'admin') {
            // Admin users can access admin panel. Language stays user-controlled.
            void u
          }
        })
        .catch(() => {
          // Token invalid/expired
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setTokenState(res.access_token)
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  const register = async (data: { full_name: string; email: string; password: string; phone?: string; location?: string }) => {
    const res = await authApi.register({ ...data, preferred_language: language })
    setTokenState(res.access_token)
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setTokenState(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, language, changeLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
