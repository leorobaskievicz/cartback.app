import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Tenant from '#models/tenant'
import MessageTemplate from '#models/message_template'
import { registerValidator, loginValidator } from '#validators/auth'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AuthController {
  /**
   * POST /api/auth/register
   */
  async register({ request, response }: HttpContext) {
    const data = await registerValidator.validate(request.all())

    const trx = await db.transaction()

    try {
      // Criar tenant
      const tenant = await Tenant.create(
        {
          name: data.tenantName,
          email: data.email,
          phone: data.phone || null,
          plan: 'trial',
          trialEndsAt: DateTime.now().plus({ days: 14 }),
          isActive: true,
        },
        { client: trx }
      )

      // Criar user owner
      const user = await User.create(
        {
          tenantId: tenant.id,
          email: data.email,
          password: data.password,
          name: data.name,
          role: 'owner',
        },
        { client: trx }
      )

      // Criar templates padrão
      await MessageTemplate.createMany(
        [
          {
            tenantId: tenant.id,
            name: '30 minutos',
            triggerType: 'abandoned_cart',
            delayMinutes: 30,
            content:
              'Oi {customerName}! Vi que você deixou alguns itens no carrinho 🛒\n\nQuer finalizar sua compra? {cartUrl}',
            isActive: true,
            sortOrder: 1,
          },
          {
            tenantId: tenant.id,
            name: '24 horas',
            triggerType: 'abandoned_cart',
            delayMinutes: 1440,
            content:
              'Olá {customerName}! Seus produtos ainda estão esperando por você 😊\n\nFinalize sua compra: {cartUrl}',
            isActive: true,
            sortOrder: 2,
          },
          {
            tenantId: tenant.id,
            name: '48 horas',
            triggerType: 'abandoned_cart',
            delayMinutes: 2880,
            content:
              'Última chance {customerName}! ⏰\n\nSeus itens podem esgotar. Garanta agora: {cartUrl}',
            isActive: true,
            sortOrder: 3,
          },
        ],
        { client: trx }
      )

      await trx.commit()

      // Criar token APÓS commit da transação para evitar lock timeout
      const token = await User.accessTokens.create(user, ['*'], { expiresIn: '30 days' })

      return response.created({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
          },
          tenant: {
            id: tenant.id,
            uuid: tenant.uuid,
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            plan: tenant.plan,
            isActive: tenant.isActive,
            trialEndsAt: tenant.trialEndsAt,
          },
          token: token.value!.release(),
        },
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * POST /api/auth/login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await loginValidator.validate(request.all())

    const user = await User.verifyCredentials(email, password)

    await user.load('tenant')

    if (!user.tenant || !user.tenant.isActive) {
      return response.forbidden({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: 'Your account is inactive. Please contact support.',
        },
      })
    }

    const token = await User.accessTokens.create(user, ['*'], { expiresIn: '30 days' })

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        tenant: {
          id: user.tenant.id,
          uuid: user.tenant.uuid,
          name: user.tenant.name,
          email: user.tenant.email,
          phone: user.tenant.phone,
          plan: user.tenant.plan,
          isActive: user.tenant.isActive,
          trialEndsAt: user.tenant.trialEndsAt,
        },
        token: token.value!.release(),
      },
    })
  }

  /**
   * POST /api/auth/logout
   */
  async logout({ response }: HttpContext) {
    return response.ok({
      success: true,
      data: { message: 'Logged out successfully' },
    })
  }

  /**
   * GET /api/auth/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    await user.load('tenant')

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        tenant: {
          id: user.tenant.id,
          uuid: user.tenant.uuid,
          name: user.tenant.name,
          email: user.tenant.email,
          phone: user.tenant.phone,
          plan: user.tenant.plan,
          isActive: user.tenant.isActive,
          trialEndsAt: user.tenant.trialEndsAt,
        },
      },
    })
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])

    if (!currentPassword || !newPassword) {
      return response.badRequest({
        success: false,
        error: 'Current password and new password are required',
      })
    }

    // Verificar senha atual
    try {
      await User.verifyCredentials(user.email, currentPassword)
    } catch (error) {
      return response.unauthorized({
        success: false,
        error: 'Senha atual incorreta',
      })
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      return response.badRequest({
        success: false,
        error: 'Nova senha deve ter no mínimo 6 caracteres',
      })
    }

    // Atualizar senha
    user.password = newPassword
    await user.save()

    return response.ok({
      success: true,
      data: {
        message: 'Senha alterada com sucesso',
      },
    })
  }
}
