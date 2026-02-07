import { Job } from 'bullmq'
import MessageLog from '#models/message_log'
import MessageTemplate from '#models/message_template'
import AbandonedCart from '#models/abandoned_cart'
import WhatsappInstance from '#models/whatsapp_instance'
import Subscription from '#models/subscription'
import evolutionApi from '#services/evolution_api_service'
import queueService from '#jobs/queue_service'
import RateLimiterService from '#services/rate_limiter_service'
import WhatsappHealthService from '#services/whatsapp_health_service'
import { DateTime } from 'luxon'

/**
 * Dados do job de envio de mensagem
 */
export interface SendMessageData {
  messageLogId: number
  cartId: number
  templateId: number
  whatsappInstanceId: number
}

/**
 * Job que envia mensagem WhatsApp para cliente
 *
 * Fluxo:
 * 1. Verifica se carrinho ainda está pending
 * 2. Verifica se WhatsApp ainda está conectado
 * 3. Verifica limite de mensagens
 * 4. Substitui placeholders no template
 * 5. Envia via Evolution API
 * 6. Atualiza status e incrementa contador
 */
export async function sendWhatsappMessage(job: Job<SendMessageData>): Promise<void> {
  const { messageLogId, cartId, templateId, whatsappInstanceId } = job.data

  console.log(`[SendMessage] Processando envio da mensagem ${messageLogId}`)

  // Buscar MessageLog
  const messageLog = await MessageLog.find(messageLogId)
  if (!messageLog || messageLog.status !== 'queued') {
    console.log(
      `[SendMessage] MessageLog ${messageLogId} não encontrado ou status inválido (${messageLog?.status})`
    )
    return
  }

  // Buscar carrinho
  const cart = await AbandonedCart.find(cartId)
  if (!cart) {
    messageLog.status = 'failed'
    messageLog.errorMessage = 'Carrinho não encontrado'
    await messageLog.save()
    console.log(`[SendMessage] Carrinho ${cartId} não encontrado`)
    return
  }

  // Se carrinho foi recuperado ou cancelado, não enviar
  if (cart.status !== 'pending') {
    messageLog.status = 'cancelled'
    messageLog.errorMessage = `Carrinho está ${cart.status}`
    await messageLog.save()
    console.log(`[SendMessage] Carrinho ${cartId} não está mais pending (status: ${cart.status})`)
    return
  }

  // Buscar template
  const template = await MessageTemplate.find(templateId)
  if (!template || !template.isActive) {
    messageLog.status = 'failed'
    messageLog.errorMessage = 'Template não encontrado ou inativo'
    await messageLog.save()
    console.log(`[SendMessage] Template ${templateId} não encontrado ou inativo`)
    return
  }

  // Buscar WhatsApp instance
  const whatsapp = await WhatsappInstance.find(whatsappInstanceId)
  if (!whatsapp || whatsapp.status !== 'connected') {
    messageLog.status = 'failed'
    messageLog.errorMessage = `WhatsApp não conectado (status: ${whatsapp?.status})`
    await messageLog.save()
    console.log(`[SendMessage] WhatsApp ${whatsappInstanceId} não está conectado`)

    // Re-throw para Bull tentar novamente depois
    throw new Error(`WhatsApp instance ${whatsappInstanceId} not connected`)
  }

  // Verificar limite de mensagens
  const subscription = await Subscription.query().where('tenant_id', cart.tenantId).first()

  if (subscription && subscription.messagesUsed >= subscription.messagesLimit) {
    messageLog.status = 'failed'
    messageLog.errorMessage = 'Limite de mensagens atingido'
    await messageLog.save()
    console.log(
      `[SendMessage] Tenant ${cart.tenantId} atingiu limite de mensagens (${subscription.messagesUsed}/${subscription.messagesLimit})`
    )
    return
  }

  // ========== RATE LIMITING & HEALTH CHECK ==========
  const rateLimiter = new RateLimiterService()
  const healthService = new WhatsappHealthService()

  // Montar mensagem antes de validar (precisa do conteúdo)
  const finalMessage = replacePlaceholders(template.content, {
    nome: cart.customerName || 'Cliente',
    produtos: formatProducts(cart.items || []),
    link: cart.cartUrl || '[Link não disponível]',
    total: formatCurrency(cart.totalValue || 0),
  })

  // 1. Validar conteúdo da mensagem
  const contentValidation = await rateLimiter.validateMessageContent(
    cart.tenantId,
    finalMessage,
    templateId
  )

  if (!contentValidation.valid) {
    messageLog.status = 'failed'
    messageLog.errorMessage = `Mensagem rejeitada: ${contentValidation.reason}`
    await messageLog.save()
    console.log(`[SendMessage] Mensagem rejeitada: ${contentValidation.reason}`)
    return
  }

  // 2. Verificar rate limits
  const rateLimitCheck = await rateLimiter.canSendMessage(cart.tenantId, whatsappInstanceId)

  if (!rateLimitCheck.allowed) {
    console.log(`[SendMessage] Rate limit atingido: ${rateLimitCheck.reason}`)

    // Se tiver retryAfter, reagendar
    if (rateLimitCheck.retryAfter && rateLimitCheck.retryAfter < 3600) {
      const delayMs = rateLimitCheck.retryAfter * 1000
      console.log(`[SendMessage] Reagendando mensagem ${messageLogId} em ${rateLimitCheck.retryAfter}s`)

      // Reagendar job para envio posterior
      await queueService.addJob(
        'send-whatsapp-message',
        { messageLogId, cartId, templateId, whatsappInstanceId },
        { delay: delayMs }
      )

      return
    }

    // Se delay for muito longo, falhar
    messageLog.status = 'failed'
    messageLog.errorMessage = `Rate limit: ${rateLimitCheck.reason}`
    await messageLog.save()
    return
  }

  try {
    console.log(`[SendMessage] Enviando mensagem para ${cart.customerPhone}...`)

    // 3. Registrar que estamos enviando (para rate limiting em tempo real)
    await rateLimiter.recordMessageSend(cart.tenantId, whatsappInstanceId)

    // Enviar via Evolution API
    const result = await evolutionApi.sendText(whatsapp.instanceName, cart.customerPhone, finalMessage)

    // Atualizar log com sucesso
    messageLog.content = finalMessage
    messageLog.status = 'sent'
    messageLog.externalMessageId = result.key.id
    messageLog.sentAt = DateTime.now()
    await messageLog.save()

    // Incrementar contador de mensagens usadas
    if (subscription) {
      subscription.messagesUsed += 1
      await subscription.save()
    }

    // 4. Atualizar métricas de saúde
    await healthService.calculateAndUpdateMetrics(whatsappInstanceId)

    console.log(`[SendMessage] ✅ Mensagem ${messageLogId} enviada com sucesso (external ID: ${result.key.id})`)
  } catch (error: any) {
    console.error(`[SendMessage] ❌ Erro ao enviar mensagem ${messageLogId}:`, error.message)
    console.error(`[SendMessage] Stack trace:`, error.stack)

    messageLog.status = 'failed'
    messageLog.errorMessage = error.message
    await messageLog.save()

    // Atualizar métricas mesmo em caso de erro
    try {
      await healthService.calculateAndUpdateMetrics(whatsappInstanceId)
    } catch (healthError: any) {
      console.error(`[SendMessage] Erro ao calcular métricas:`, healthError.message)
    }

    // Re-throw para o Bull fazer retry automático
    throw error
  }
}

/**
 * Substitui placeholders no template de mensagem
 *
 * Suporta: {{nome}}, {{produtos}}, {{link}}, {{total}}
 */
function replacePlaceholders(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match
  })
}

/**
 * Formata lista de produtos para exibição na mensagem
 */
function formatProducts(items: any[]): string {
  if (!items || items.length === 0) {
    return 'seus produtos'
  }

  if (items.length === 1) {
    return items[0].name || items[0].title || 'seu produto'
  }

  const firstName = items[0].name || items[0].title || 'produto'
  return `${firstName} e mais ${items.length - 1} item${items.length > 2 ? 's' : ''}`
}

/**
 * Formata valor monetário para BRL
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default sendWhatsappMessage
