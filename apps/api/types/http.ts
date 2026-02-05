/**
 * Extensão de tipos para HttpContext
 * Adiciona propriedades personalizadas ao HttpContext
 */

import User from '#models/user'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    auth: {
      user: User | null
      authenticate(): Promise<User>
      check(): Promise<boolean>
      getUserOrFail(): Promise<User>
      use(guard?: string): any
    }
  }

  export interface Request {
    validateUsing<T = any>(validator: any): Promise<T>
  }
}
