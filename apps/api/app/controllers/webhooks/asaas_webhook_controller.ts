import type { HttpContext } from '@adonisjs/core/http'
import asaasService from '#services/asaas_service'
import planService from '#services/plan_service'

export default class AsaasWebhookController {
  async handle({ request, response }: HttpContext) {
    // Validar token do webhook
    const token = request.header('asaas-access-token')

    if (!asaasService.validateWebhookSignature(token || '')) {
      console.log('❌ [Asaas Webhook] Token inválido!')
      return response.unauthorized({ error: 'Invalid webhook token' })
    }

    console.log('✅ [Asaas Webhook] Token validado com sucesso')

    const payload = request.body()
    const event = payload.event
    const payment = payload.payment

    console.log(`[Asaas Webhook] Event: ${event}`, payment?.id)

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await planService.handlePaymentConfirmed(payment.id)
        break

      case 'PAYMENT_OVERDUE':
        await planService.handlePaymentOverdue(payment.id)
        break

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_DELETED':
        // Tratar reembolso/cancelamento se necessário
        break

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`)
    }

    return response.ok({ received: true })
  }
}
