import { DateTime } from 'luxon'
import Subscription from '#models/subscription'
import Tenant from '#models/tenant'
import MessageTemplate from '#models/message_template'
import PaymentHistory from '#models/payment_history'
import asaasService, {
  type CreditCardData,
  type CreditCardHolderInfo,
} from './asaas_service.js'
import { PLANS, PlanType, getPlanLimits } from '#constants/plans'

class PlanService {
  // Criar subscription inicial (trial)
  async createTrialSubscription(tenantId: number, trx?: any): Promise<Subscription> {
    const trialPlan = PLANS.trial
    const trialDays = trialPlan.trialDays

    return Subscription.create(
      {
        tenantId,
        plan: 'trial',
        status: 'trial',
        messagesLimit: trialPlan.messagesLimit,
        messagesUsed: 0,
        paymentGateway: null,
        currentPeriodStart: DateTime.now(),
        currentPeriodEnd: DateTime.now().plus({ days: trialDays }),
        trialEndsAt: DateTime.now().plus({ days: trialDays }),
      },
      trx ? { client: trx } : undefined
    )
  }

  // Verificar se pode enviar mensagem
  async canSendMessage(tenantId: number): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()

    // Trial expirado
    if (
      subscription.status === 'trial' &&
      subscription.trialEndsAt &&
      DateTime.now() > subscription.trialEndsAt
    ) {
      return { allowed: false, reason: 'trial_expired' }
    }

    // Subscription cancelada ou vencida
    if (['cancelled', 'past_due'].includes(subscription.status)) {
      return { allowed: false, reason: 'subscription_inactive' }
    }

    // Limite de mensagens atingido
    if (subscription.messagesUsed >= subscription.messagesLimit) {
      return { allowed: false, reason: 'limit_reached' }
    }

    return { allowed: true }
  }

  // Registrar envio de mensagem
  async recordMessageSent(tenantId: number): Promise<void> {
    await Subscription.query().where('tenantId', tenantId).increment('messagesUsed', 1)
  }

  // Verificar limite de templates
  async canCreateTemplate(
    tenantId: number
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()

    const planLimits = getPlanLimits(subscription.plan)
    const currentCount = await MessageTemplate.query()
      .where('tenantId', tenantId)
      .count('* as total')

    const current = Number(currentCount[0].$extras.total)
    const limit = planLimits.templatesLimit

    // -1 = ilimitado
    if (limit === -1) {
      return { allowed: true, current, limit: -1 }
    }

    return {
      allowed: current < limit,
      current,
      limit,
    }
  }

  // Obter status completo do plano
  async getPlanStatus(tenantId: number): Promise<{
    plan: PlanType
    planName: string
    status: string
    price: number
    messagesUsed: number
    messagesLimit: number
    messagesRemaining: number
    usagePercentage: number
    templatesUsed: number
    templatesLimit: number
    currentPeriodEnd: DateTime
    trialEndsAt: DateTime | null
    isTrialExpired: boolean
    daysRemaining: number
    isPaid: boolean
  }> {
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()

    const planLimits = getPlanLimits(subscription.plan)
    const templatesCount = await MessageTemplate.query()
      .where('tenantId', tenantId)
      .count('* as total')

    const templatesUsed = Number(templatesCount[0].$extras.total)
    const messagesRemaining = Math.max(0, subscription.messagesLimit - subscription.messagesUsed)
    const usagePercentage = Math.round(
      (subscription.messagesUsed / subscription.messagesLimit) * 100
    )

    const isTrialExpired =
      subscription.status === 'trial' &&
      subscription.trialEndsAt !== null &&
      DateTime.now() > subscription.trialEndsAt

    const daysRemaining = subscription.trialEndsAt
      ? Math.max(0, Math.ceil(subscription.trialEndsAt.diff(DateTime.now(), 'days').days))
      : subscription.currentPeriodEnd
        ? Math.max(0, Math.ceil(subscription.currentPeriodEnd.diff(DateTime.now(), 'days').days))
        : 0

    return {
      plan: subscription.plan,
      planName: planLimits.name,
      status: subscription.status,
      price: planLimits.price,
      messagesUsed: subscription.messagesUsed,
      messagesLimit: subscription.messagesLimit,
      messagesRemaining,
      usagePercentage,
      templatesUsed,
      templatesLimit: planLimits.templatesLimit,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      isTrialExpired,
      daysRemaining,
      isPaid: subscription.plan !== 'trial' && subscription.status === 'active',
    }
  }

  // Iniciar assinatura paga
  async startPaidSubscription(
    tenantId: number,
    plan: PlanType,
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO',
    creditCard?: {
      data: CreditCardData
      holderInfo: CreditCardHolderInfo
    }
  ): Promise<{ subscription: Subscription; payment: PaymentHistory }> {
    const tenant = await Tenant.findOrFail(tenantId)
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()
    const planLimits = getPlanLimits(plan)

    // Criar ou buscar customer no Asaas
    let customerId = subscription.externalCustomerId
    if (!customerId) {
      const customer = await asaasService.createCustomer({
        name: tenant.name,
        email: tenant.email,
        cpfCnpj: tenant.cpfCnpj || '',
        phone: tenant.phone || undefined,
        externalReference: String(tenantId),
      })
      customerId = customer.id
    }

    // Criar assinatura no Asaas
    const nextDueDate = DateTime.now().toFormat('yyyy-MM-dd')
    let asaasSubscription

    if (billingType === 'CREDIT_CARD') {
      // Validar dados do cartão
      if (!creditCard) {
        throw new Error('Dados do cartão são obrigatórios para pagamento com cartão de crédito')
      }

      // Tokenizar cartão
      const creditCardToken = await asaasService.tokenizeCreditCard(
        customerId,
        creditCard.data,
        creditCard.holderInfo
      )

      // Criar subscription com cartão
      asaasSubscription = await asaasService.createSubscriptionWithCreditCard({
        customer: customerId,
        value: planLimits.price / 100, // Asaas usa reais, não centavos
        nextDueDate,
        description: `Cartback - Plano ${planLimits.name}`,
        creditCardToken: creditCardToken.creditCardToken,
        creditCardHolderInfo: creditCard.holderInfo,
        externalReference: String(subscription.id),
      })
    } else {
      // PIX ou Boleto
      asaasSubscription = await asaasService.createSubscription({
        customer: customerId,
        billingType,
        value: planLimits.price / 100, // Asaas usa reais, não centavos
        nextDueDate,
        cycle: 'MONTHLY',
        description: `Cartback - Plano ${planLimits.name}`,
        externalReference: String(subscription.id),
      })
    }

    // Atualizar subscription local
    // IMPORTANTE: Só ativa o plano imediatamente se for cartão de crédito
    // PIX e Boleto ficam pendentes até confirmação do pagamento
    if (billingType === 'CREDIT_CARD') {
      subscription.plan = plan
      subscription.status = 'active'
      subscription.messagesLimit = planLimits.messagesLimit
      subscription.currentPeriodStart = DateTime.now()
      subscription.currentPeriodEnd = DateTime.now().plus({ months: 1 })
      subscription.trialEndsAt = null
    } else {
      // PIX/Boleto: mantém plano atual e status pending
      subscription.status = 'pending'
    }

    subscription.paymentGateway = 'asaas'
    subscription.externalSubscriptionId = asaasSubscription.id
    subscription.externalCustomerId = customerId
    await subscription.save()

    // Buscar primeiro pagamento gerado
    const payments = await asaasService.listSubscriptionPayments(asaasSubscription.id)
    const firstPayment = payments[0]

    // Buscar QR code PIX se necessário
    let pixData = null
    if (billingType === 'PIX' && firstPayment) {
      pixData = await asaasService.getPaymentPixQrCode(firstPayment.id)
    }

    // Registrar no histórico com o plano escolhido (targetPlan)
    const paymentHistory = await PaymentHistory.create({
      tenantId,
      subscriptionId: subscription.id,
      targetPlan: plan, // Armazena qual plano foi escolhido para ativar quando pagar
      externalPaymentId: firstPayment?.id || '',
      amount: planLimits.price,
      status: billingType === 'CREDIT_CARD' ? 'confirmed' : 'pending',
      paymentMethod: billingType.toLowerCase() as 'pix' | 'credit_card' | 'boleto',
      dueDate: DateTime.fromISO(firstPayment?.dueDate || nextDueDate),
      invoiceUrl: firstPayment?.invoiceUrl || null,
      pixQrCode: pixData?.encodedImage || null,
      pixCopyPaste: pixData?.payload || null,
      paidAt: billingType === 'CREDIT_CARD' ? DateTime.now() : null,
    })

    return { subscription, payment: paymentHistory }
  }

  // Mudar de plano (upgrade/downgrade)
  async changePlan(tenantId: number, newPlan: PlanType): Promise<Subscription> {
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()
    const planLimits = getPlanLimits(newPlan)

    // Se tem assinatura no Asaas, atualizar valor
    if (subscription.externalSubscriptionId) {
      await asaasService.updateSubscription(subscription.externalSubscriptionId, {
        value: planLimits.price / 100,
      })
    }

    // Atualizar localmente
    subscription.plan = newPlan
    subscription.messagesLimit = planLimits.messagesLimit
    await subscription.save()

    return subscription
  }

  // Cancelar assinatura
  async cancelSubscription(tenantId: number): Promise<void> {
    const subscription = await Subscription.query().where('tenantId', tenantId).firstOrFail()

    if (subscription.externalSubscriptionId) {
      await asaasService.cancelSubscription(subscription.externalSubscriptionId)
    }

    subscription.status = 'cancelled'
    await subscription.save()
  }

  // Processar webhook de pagamento confirmado
  async handlePaymentConfirmed(externalPaymentId: string): Promise<void> {
    const paymentHistory = await PaymentHistory.query()
      .where('externalPaymentId', externalPaymentId)
      .first()

    if (!paymentHistory) return

    paymentHistory.status = 'confirmed'
    paymentHistory.paidAt = DateTime.now()
    await paymentHistory.save()

    // Ativar subscription e aplicar o plano escolhido
    const subscription = await Subscription.find(paymentHistory.subscriptionId)
    if (subscription && subscription.status !== 'active') {
      subscription.status = 'active'

      // Se tem plano pendente (targetPlan), ativar agora
      if (paymentHistory.targetPlan) {
        const planLimits = getPlanLimits(paymentHistory.targetPlan as PlanType)
        subscription.plan = paymentHistory.targetPlan as PlanType
        subscription.messagesLimit = planLimits.messagesLimit
        subscription.messagesUsed = 0 // Reset contador
        subscription.currentPeriodStart = DateTime.now()
        subscription.currentPeriodEnd = DateTime.now().plus({ months: 1 })
        subscription.trialEndsAt = null
      }

      await subscription.save()
    }
  }

  // Processar webhook de pagamento vencido
  async handlePaymentOverdue(externalPaymentId: string): Promise<void> {
    const paymentHistory = await PaymentHistory.query()
      .where('externalPaymentId', externalPaymentId)
      .first()

    if (!paymentHistory) return

    paymentHistory.status = 'overdue'
    await paymentHistory.save()

    // Marcar subscription como past_due
    const subscription = await Subscription.find(paymentHistory.subscriptionId)
    if (subscription) {
      subscription.status = 'past_due'
      await subscription.save()
    }
  }

  // Resetar contador mensal
  async resetMonthlyUsage(subscriptionId: number): Promise<void> {
    const subscription = await Subscription.findOrFail(subscriptionId)
    subscription.messagesUsed = 0
    subscription.currentPeriodStart = DateTime.now()
    subscription.currentPeriodEnd = DateTime.now().plus({ months: 1 })
    await subscription.save()
  }
}

export default new PlanService()
