import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await ctx.auth.authenticateUsing(['api'])
    } catch {
      return ctx.response.unauthorized({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    }

    return next()
  }
}
