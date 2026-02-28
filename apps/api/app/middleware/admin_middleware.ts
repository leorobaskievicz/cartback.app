import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware que verifica se o usuário autenticado é um administrador do sistema
 *
 * Uso:
 * - Aplicar em rotas que só administradores devem acessar
 * - Requer que o middleware de autenticação seja aplicado antes
 */
export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    // Garantir que usuário está autenticado
    const user = auth.user

    if (!user) {
      return response.unauthorized({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      })
    }

    // Verificar se é admin
    if (!user.isAdmin) {
      console.warn(`[Admin Middleware] Acesso negado para usuário ${user.id} (${user.email})`)
      return response.forbidden({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      })
    }

    console.log(`[Admin Middleware] Acesso admin concedido para ${user.email}`)
    await next()
  }
}
