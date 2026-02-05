export interface LoginDTO {
  email: string
  password: string
}

export interface RegisterDTO {
  email: string
  password: string
  name: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: {
    id: number
    email: string
    name: string
  }
  tokens: AuthTokens
}
