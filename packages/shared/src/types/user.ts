export interface User {
  id: number
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserDTO {
  email: string
  password: string
  name: string
}

export interface UpdateUserDTO {
  email?: string
  name?: string
}
