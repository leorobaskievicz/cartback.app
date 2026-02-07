import { Job } from 'bullmq'
import AbandonedCart from '#models/abandoned_cart'
import MessageTemplate from '#models/message_template'
import MessageLog from '#models/message_log'
import WhatsappInstance from '#models/whatsapp_instance'
import Subscription from '#models/subscription'
import queueService from '#jobs/queue_service'
import { DateTime } from 'luxon'

/**
 * Dados do carrinho abandonado recebido via webhook
 */
export interface ProcessCartData {
  tenantId: number
  storeIntegrationId: number
  externalCartId: string
  externalCustomerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone: string
  cartUrl?: string
  totalValue?: number
  items: any[]
}

/**
 * Job que processa um carrinho abandonado
 *
 * Fluxo:
 * 1. Verifica se tenant tem WhatsApp conectado
 * 2. Verifica limite de mensagens do plano
 * 3. Cria registro do carrinho no banco
 * 4. Busca templates ativos
 * 5. Agenda mensagens para cada template baseado no delay_minutes
 * 6. Agenda job de verificação de recuperação
 */
export async function processAbandonedCart(job: Job<ProcessCartData>): Promise<void> {
  const data = job.data

  console.log(`[ProcessCart] Processando carrinho ${data.externalCartId} do tenant ${data.tenantId}`)

  // 1. Verificar se tenant tem WhatsApp conectado
  const whatsapp = await WhatsappInstance.query()
    .where('tenant_id', data.tenantId)
    .where('status', 'connected')
    .first()

  // 2. Verificar limite de mensagens
  const subscription = await Subscription.query().where('tenant_id', data.tenantId).first()

  const canSendMessages = whatsapp && subscription && subscription.messagesUsed < subscription.messagesLimit

  if (!whatsapp) {
    console.log(
      `[ProcessCart] ⚠️ Tenant ${data.tenantId} não tem WhatsApp conectado, carrinho será criado mas mensagens não serão enviadas`
    )
  } else if (subscription && subscription.messagesUsed >= subscription.messagesLimit) {
    console.log(
      `[ProcessCart] ⚠️ Tenant ${data.tenantId} atingiu limite de mensagens (${subscription.messagesUsed}/${subscription.messagesLimit})`
    )
  }

  // 3. Verificar se carrinho já existe (evitar duplicatas de webhook)
  const existingCart = await AbandonedCart.query()
    .where('tenant_id', data.tenantId)
    .where('external_cart_id', data.externalCartId)
    .first()

  if (existingCart) {
    console.log(`[ProcessCart] Carrinho ${data.externalCartId} já existe (ID: ${existingCart.id}), ignorando`)
    return
  }

  // 4. Criar carrinho abandonado no banco
  const cart = await AbandonedCart.create({
    tenantId: data.tenantId,
    storeIntegrationId: data.storeIntegrationId,
    externalCartId: data.externalCartId,
    externalCustomerId: data.externalCustomerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    cartUrl: data.cartUrl,
    totalValue: data.totalValue,
    items: data.items,
    status: 'pending',
    expiresAt: DateTime.now().plus({ days: 7 }), // 7 dias
  })

  console.log(`[ProcessCart] Carrinho ${cart.id} criado no banco`)

  // 5. Só agendar mensagens se WhatsApp está conectado e há limite disponível
  if (!canSendMessages) {
    console.log(`[ProcessCart] ⚠️ Mensagens não serão agendadas (WhatsApp desconectado ou limite atingido)`)
    return
  }

  // 6. Buscar templates ativos (ordenados por delay)
  const templates = await MessageTemplate.query()
    .where('tenant_id', data.tenantId)
    .where('trigger_type', 'abandoned_cart')
    .where('is_active', true)
    .orderBy('delay_minutes', 'asc')

  if (templates.length === 0) {
    console.log(`[ProcessCart] Tenant ${data.tenantId} não tem templates ativos, nenhuma mensagem agendada`)
    return
  }

  // 7. Agendar mensagens para cada template
  let scheduledCount = 0

  for (const template of templates) {
    const delayMs = template.delayMinutes * 60 * 1000
    const jobId = `msg-${cart.id}-${template.id}`

    // Criar log de mensagem com status 'queued'
    const messageLog = await MessageLog.create({
      tenantId: data.tenantId,
      abandonedCartId: cart.id,
      messageTemplateId: template.id,
      whatsappInstanceId: whatsapp!.id,
      phoneNumber: data.customerPhone,
      content: '', // Será preenchido no momento do envio
      status: 'queued',
    })

    // Agendar job de envio
    await queueService.addJob(
      'send-whatsapp-message',
      {
        messageLogId: messageLog.id,
        cartId: cart.id,
        templateId: template.id,
        whatsappInstanceId: whatsapp!.id,
      },
      {
        delay: delayMs,
        jobId,
      }
    )

    scheduledCount++
    console.log(
      `[ProcessCart] Mensagem ${messageLog.id} agendada para +${template.delayMinutes}min (job: ${jobId})`
    )
  }

  // 8. Agendar verificação de recuperação (12h depois da última mensagem)
  const lastTemplate = templates[templates.length - 1]
  const checkDelay = (lastTemplate.delayMinutes + 12 * 60) * 60 * 1000 // última mensagem + 12h

  await queueService.addJob(
    'check-cart-recovered',
    {
      cartId: cart.id,
      tenantId: data.tenantId,
    },
    {
      delay: checkDelay,
      jobId: `check-${cart.id}`,
    }
  )

  console.log(
    `[ProcessCart] ✅ Carrinho ${cart.id} processado com sucesso: ${scheduledCount} mensagens agendadas`
  )
}

export default processAbandonedCart
