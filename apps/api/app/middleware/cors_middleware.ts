import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const { request, response } = ctx
      const origin = request.header('origin') || '*'

      // Set CORS headers
      response.header('Access-Control-Allow-Origin', origin)
      response.header('Access-Control-Allow-Credentials', 'true')
      response.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
      )
      response.header(
        'Access-Control-Allow-Headers',
        request.header('Access-Control-Request-Headers') || 'Content-Type, Authorization'
      )
      response.header('Access-Control-Max-Age', '90')

      // Handle preflight requests
      if (request.method() === 'OPTIONS') {
        return response.status(204).send('')
      }

      await next()
    } catch (error) {
      console.error('=== ERRO NO CORS MIDDLEWARE ===', error)
      throw error
    }
  }
}
