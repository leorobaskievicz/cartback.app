import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import PaymentHistory from '#models/payment_history'
import planService from '#services/plan_service'
import { PLANS, PlanType } from '#constants/plans'
import {
  checkoutCreditCardValidator,
  checkoutSimpleValidator,
} from '#validators/checkout'

export default class PlansController {
  // GET /api/plans - lista planos disponíveis (público)
  async index({ response }: HttpContext) {
    const plans = Object.entries(PLANS)
      .filter(([key]) => key !== 'trial')
      .map(([key, plan]) => ({
        id: key,
        name: plan.name,
        price: plan.price,
        priceFormatted: (plan.price / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        messagesLimit: plan.messagesLimit,
        templatesLimit: plan.templatesLimit,
        features: [
          `${plan.messagesLimit.toLocaleString()} mensagens/mês`,
          plan.templatesLimit === -1
            ? 'Templates ilimitados'
            : `${plan.templatesLimit} templates`,
          'Integração Nuvemshop',
          'Dashboard de métricas',
          'Suporte por email',
        ],
      }))

    return response.ok({ success: true, data: plans })
  }

  // GET /api/subscription - status atual
  async show({ auth, response }: HttpContext) {
    try {
      console.log('📊 PlansController.show - Starting')
      const user = auth.user!
      console.log('👤 User:', user.id, 'TenantId:', user.tenantId)
      const status = await planService.getPlanStatus(user.tenantId)
      console.log('✅ Status retrieved:', status)
      return response.ok({ success: true, data: status })
    } catch (error: any) {
      console.error('❌ PlansController.show - Error:', error.message, error.stack)
      return response.internalServerError({
        success: false,
        error: error.message,
      })
    }
  }

  // GET /api/subscription/usage - uso atual
  async usage({ auth, response }: HttpContext) {
    const user = auth.user!
    const status = await planService.getPlanStatus(user.tenantId)

    return response.ok({
      success: true,
      data: {
        messages: {
          used: status.messagesUsed,
          limit: status.messagesLimit,
          remaining: status.messagesRemaining,
          percentage: status.usagePercentage,
        },
        templates: {
          used: status.templatesUsed,
          limit: status.templatesLimit,
        },
      },
    })
  }

  // POST /api/subscription/checkout - iniciar checkout
  async checkout({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const billingType = request.input('billingType')

    // Verificar se tenant tem CPF/CNPJ
    const tenant = await Tenant.findOrFail(user.tenantId)
    if (!tenant.cpfCnpj) {
      return response.badRequest({
        success: false,
        error: 'CPF/CNPJ necessário para assinatura',
        code: 'MISSING_DOCUMENT',
      })
    }

    try {
      // Validar dados baseado no tipo de pagamento
      let result
      if (billingType === 'CREDIT_CARD') {
        const data = await checkoutCreditCardValidator.validate(request.all())
        result = await planService.startPaidSubscription(
          user.tenantId,
          data.plan as PlanType,
          data.billingType,
          {
            data: data.creditCard,
            holderInfo: data.holderInfo,
          }
        )
      } else {
        const data = await checkoutSimpleValidator.validate(request.all())
        result = await planService.startPaidSubscription(
          user.tenantId,
          data.plan as PlanType,
          data.billingType,
          undefined
        )
      }

      return response.ok({
        success: true,
        data: {
          subscription: {
            plan: result.subscription.plan,
            status: result.subscription.status,
          },
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            status: result.payment.status,
            paymentMethod: result.payment.paymentMethod,
            dueDate: result.payment.dueDate,
            invoiceUrl: result.payment.invoiceUrl,
            pixQrCode: result.payment.pixQrCode,
            pixCopyPaste: result.payment.pixCopyPaste,
            boletoUrl: result.payment.boletoUrl,
          },
        },
      })
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error.response?.data || error.message)

      // Retornar erro de validação
      if (error.messages) {
        return response.badRequest({
          success: false,
          error: 'Dados inválidos',
          validation: error.messages,
        })
      }

      return response.internalServerError({
        success: false,
        error: 'Erro ao processar assinatura',
        details: error.message,
      })
    }
  }

  // POST /api/subscription/change - mudar de plano
  async change({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { plan } = request.only(['plan'])

    if (!['starter', 'pro', 'business'].includes(plan)) {
      return response.badRequest({ success: false, error: 'Plano inválido' })
    }

    const subscription = await planService.changePlan(user.tenantId, plan as PlanType)
    const status = await planService.getPlanStatus(user.tenantId)

    return response.ok({ success: true, data: status })
  }

  // POST /api/subscription/cancel - cancelar
  async cancel({ auth, response }: HttpContext) {
    const user = auth.user!
    await planService.cancelSubscription(user.tenantId)
    return response.ok({ success: true, message: 'Assinatura cancelada' })
  }

  // GET /api/subscription/payments - histórico de pagamentos
  async payments({ auth, response }: HttpContext) {
    try {
      console.log('💰 PlansController.payments - Starting')
      const user = auth.user!
      console.log('👤 User:', user.id, 'TenantId:', user.tenantId)

      const payments = await PaymentHistory.query()
        .where('tenantId', user.tenantId)
        .orderBy('createdAt', 'desc')
        .limit(12)

      console.log('✅ Payments retrieved:', payments.length)
      return response.ok({ success: true, data: payments })
    } catch (error: any) {
      console.error('❌ PlansController.payments - Error:', error.message, error.stack)
      return response.internalServerError({
        success: false,
        error: error.message,
      })
    }
  }
}
