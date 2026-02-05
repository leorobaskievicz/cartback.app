import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import planService from '#services/plan_service'

export default class CheckLimitsMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!
    const status = await planService.getPlanStatus(user.tenantId)

    // Trial expirado
    if (status.isTrialExpired) {
      return response.paymentRequired({
        success: false,
        error: 'Seu período de teste expirou. Escolha um plano para continuar.',
        code: 'TRIAL_EXPIRED',
      })
    }

    // Subscription inativa
    if (status.status === 'cancelled') {
      return response.paymentRequired({
        success: false,
        error: 'Sua assinatura foi cancelada. Reative para continuar.',
        code: 'SUBSCRIPTION_CANCELLED',
      })
    }

    if (status.status === 'past_due') {
      return response.paymentRequired({
        success: false,
        error: 'Seu pagamento está pendente. Regularize para continuar.',
        code: 'PAYMENT_OVERDUE',
      })
    }

    return next()
  }
}
