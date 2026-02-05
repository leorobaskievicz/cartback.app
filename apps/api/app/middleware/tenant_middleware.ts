import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Tenant from '#models/tenant'

/**
 * Middleware que injeta o tenant no contexto HTTP
 * Extrai tenant_id do usuário autenticado
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const user = ctx.auth.user!
      console.log('🔍 TenantMiddleware - User:', user?.id, 'TenantId:', user?.tenantId)

      if (!user.tenantId) {
        console.error('❌ TenantMiddleware - User has no tenantId')
        return ctx.response.forbidden({
          success: false,
          error: {
            code: 'NO_TENANT',
            message: 'User is not associated with any tenant',
          },
        })
      }

      const tenant = await Tenant.findOrFail(user.tenantId)
      console.log('✅ TenantMiddleware - Tenant found:', tenant.id, 'Active:', tenant.isActive)

      if (!tenant.isActive) {
        console.error('❌ TenantMiddleware - Tenant is not active')
        return ctx.response.forbidden({
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: 'Tenant account is inactive',
          },
        })
      }

      // Tenant será buscado diretamente nos controllers via user.tenantId

    } catch (error: any) {
      console.error('❌ TenantMiddleware - Error:', error.message, error.stack)
      return ctx.response.internalServerError({
        success: false,
        error: {
          code: 'TENANT_ERROR',
          message: error.message,
        },
      })
    }

    return next()
  }
}
