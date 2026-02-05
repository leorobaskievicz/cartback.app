import api from './api'
import { LoginDTO, RegisterDTO, AuthResponse } from '@cartback/shared'

export const authService = {
  async login(data: LoginDTO): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login', data)
    if (response.data.tokens?.accessToken) {
      localStorage.setItem('token', response.data.tokens.accessToken)
    }
    return response.data
  },

  async register(data: RegisterDTO): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/register', data)
    if (response.data.tokens?.accessToken) {
      localStorage.setItem('token', response.data.tokens.accessToken)
    }
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/logout')
    localStorage.removeItem('token')
  },

  async me() {
    const response = await api.get('/me')
    return response.data
  },
}
