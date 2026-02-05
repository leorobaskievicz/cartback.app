import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User, Tenant } from '../types'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    tenantName: string
  }) => Promise<void>
  logout: () => void
  setTenant: (tenant: Tenant) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('🔍 AuthContext: Checking token...', token ? 'Token exists' : 'No token')

    if (token) {
      console.log('📡 AuthContext: Calling /me endpoint...')
      authApi
        .me()
        .then((res) => {
          console.log('✅ AuthContext: User loaded successfully', res.data.data)
          setUser(res.data.data.user)
          setTenant(res.data.data.tenant)
        })
        .catch((error) => {
          console.error('❌ AuthContext: Error loading user', error.response?.data || error.message)
          console.log('🗑️ AuthContext: Removing invalid token')
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    localStorage.setItem('token', res.data.data.token)
    setUser(res.data.data.user)
    setTenant(res.data.data.tenant)
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    phone?: string
    tenantName: string
  }) => {
    const res = await authApi.register(data)
    localStorage.setItem('token', res.data.data.token)
    setUser(res.data.data.user)
    setTenant(res.data.data.tenant)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setTenant(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, setTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
