import { Job } from 'bullmq'
import AbandonedCart from '#models/abandoned_cart'
import MessageTemplate from '#models/message_template'
import MessageLog from '#models/message_log'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
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
 * 1. Verifica se carrinho já existe (evitar duplicatas)
 * 2. Cria o carrinho no banco
 * 3. Detecta qual API usar (oficial tem prioridade sobre não oficial)
 * 4. Agenda mensagens conforme os templates ativos
 * 5. Agenda verificação de recuperação
 */
export async function processAbandonedCart(job: Job<ProcessCartData>): Promise<void> {
  const data = job.data

  console.log(`[ProcessCart] Processando carrinho ${data.externalCartId} do tenant ${data.tenantId}`)

  // 1. Verificar limite de mensagens
  const subscription = await Subscription.query().where('tenant_id', data.tenantId).first()

  if (subscription && subscription.messagesUsed >= subscription.messagesLimit) {
    console.log(
      `[ProcessCart] ⚠️ Tenant ${data.tenantId} atingiu limite de mensagens (${subscription.messagesUsed}/${subscription.messagesLimit})`
    )
  }

  // 2. Verificar se carrinho já existe (evitar duplicatas de webhook)
  const existingCart = await AbandonedCart.query()
    .where('tenant_id', data.tenantId)
    .where('external_cart_id', data.externalCartId)
    .first()

  if (existingCart) {
    console.log(`[ProcessCart] Carrinho ${data.externalCartId} já existe (ID: ${existingCart.id}), ignorando`)
    return
  }

  // 3. Criar carrinho abandonado no banco
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
    expiresAt: DateTime.now().plus({ days: 7 }),
  })

  console.log(`[ProcessCart] Carrinho ${cart.id} criado no banco`)

  // 4. Verificar se há limite disponível
  const canSend = !subscription || subscription.messagesUsed < subscription.messagesLimit
  if (!canSend) {
    console.log(`[ProcessCart] ⚠️ Limite de mensagens atingido, mensagens não serão agendadas`)
    return
  }

  // 5. Tentar API Oficial primeiro (tem prioridade)
  const officialScheduled = await scheduleOfficialMessages(cart, data.tenantId, subscription)

  if (officialScheduled) {
    console.log(`[ProcessCart] ✅ Carrinho ${cart.id} processado via API Oficial`)
    return
  }

  // 6. Fallback: API Não Oficial (Evolution)
  await scheduleUnofficialMessages(cart, data.tenantId, subscription)
}

/**
 * Tenta agendar mensagens via API Oficial do WhatsApp
 * Retorna true se conseguiu agendar ao menos uma mensagem
 */
async function scheduleOfficialMessages(
  cart: AbandonedCart,
  tenantId: number,
  subscription: any
): Promise<boolean> {
  // Verificar se há credenciais ativas da API Oficial
  const credential = await WhatsappOfficialCredential.query()
    .where('tenant_id', tenantId)
    .where('is_active', true)
    .where('status', 'active')
    .first()

  if (!credential) {
    console.log(`[ProcessCart] API Oficial não configurada para tenant ${tenantId}`)
    return false
  }

  // Buscar templates ativos para API Oficial
  // Aceita templates aprovados (envio via template Meta) e não aprovados (envio via texto)
  const templates = await MessageTemplate.query()
    .where('tenant_id', tenantId)
    .where('trigger_type', 'abandoned_cart')
    .where('is_active', true)
    .orderBy('delay_minutes', 'asc')

  if (templates.length === 0) {
    console.log(
      `[ProcessCart] Nenhum template ativo para 'abandoned_cart' no tenant ${tenantId}`
    )
    return false
  }

  console.log(
    `[ProcessCart] Encontrados ${templates.length} template(s) para tenant ${tenantId}:`,
    templates.map((t) => `${t.name} (meta_status: ${t.metaStatus})`)
  )

  let scheduledCount = 0

  for (const template of templates) {
    const delayMs = template.delayMinutes * 60 * 1000
    const jobId = `official-msg-${cart.id}-${template.id}`

    // Determinar se enviará como template Meta ou como texto
    const isApproved = template.metaStatus === 'approved' && template.metaTemplateId
    const messageType = isApproved ? 'template' : 'text'

    // Criar log de mensagem oficial com status 'queued'
    const officialLog = await WhatsappOfficialLog.create({
      tenantId,
      officialTemplateId: template.id,
      abandonedCartId: cart.id,
      templateName: template.metaTemplateName || template.name,
      recipientPhone: cart.customerPhone,
      recipientName: cart.customerName || null,
      languageCode: template.metaLanguage || 'pt_BR',
      messageType,
      status: 'queued',
    })

    // Agendar job de envio oficial
    await queueService.addJob(
      'send-whatsapp-official-message',
      {
        officialLogId: officialLog.id,
        cartId: cart.id,
        templateId: template.id,
        credentialId: credential.id,
      },
      {
        delay: delayMs,
        jobId,
      }
    )

    scheduledCount++
    console.log(
      `[ProcessCart] Mensagem oficial ${officialLog.id} agendada para +${template.delayMinutes}min (${messageType}: ${template.name}, meta_status: ${template.metaStatus}, job: ${jobId})`
    )
  }

  if (scheduledCount > 0) {
    // Agendar verificação de recuperação
    const lastTemplate = templates[templates.length - 1]
    const checkDelay = (lastTemplate.delayMinutes + 12 * 60) * 60 * 1000

    await queueService.addJob(
      'check-cart-recovered',
      { cartId: cart.id, tenantId },
      { delay: checkDelay, jobId: `check-${cart.id}` }
    )
  }

  return scheduledCount > 0
}

/**
 * Agenda mensagens via API Não Oficial (Evolution API)
 */
async function scheduleUnofficialMessages(
  cart: AbandonedCart,
  tenantId: number,
  subscription: any
): Promise<void> {
  // Verificar se tenant tem WhatsApp conectado
  const whatsapp = await WhatsappInstance.query()
    .where('tenant_id', tenantId)
    .where('status', 'connected')
    .first()

  if (!whatsapp) {
    console.log(
      `[ProcessCart] ⚠️ Tenant ${tenantId} não tem WhatsApp não oficial conectado, carrinho criado sem mensagens`
    )
    return
  }

  // Buscar templates ativos (ordenados por delay)
  const templates = await MessageTemplate.query()
    .where('tenant_id', tenantId)
    .where('trigger_type', 'abandoned_cart')
    .where('is_active', true)
    .orderBy('delay_minutes', 'asc')

  if (templates.length === 0) {
    console.log(`[ProcessCart] Tenant ${tenantId} não tem templates ativos, nenhuma mensagem agendada`)
    return
  }

  let scheduledCount = 0

  for (const template of templates) {
    const delayMs = template.delayMinutes * 60 * 1000
    const jobId = `msg-${cart.id}-${template.id}`

    // Criar log de mensagem com status 'queued'
    const messageLog = await MessageLog.create({
      tenantId,
      abandonedCartId: cart.id,
      messageTemplateId: template.id,
      whatsappInstanceId: whatsapp.id,
      phoneNumber: cart.customerPhone,
      content: '',
      status: 'queued',
    })

    // Agendar job de envio
    await queueService.addJob(
      'send-whatsapp-message',
      {
        messageLogId: messageLog.id,
        cartId: cart.id,
        templateId: template.id,
        whatsappInstanceId: whatsapp.id,
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

  // Agendar verificação de recuperação (12h depois da última mensagem)
  const lastTemplate = templates[templates.length - 1]
  const checkDelay = (lastTemplate.delayMinutes + 12 * 60) * 60 * 1000

  await queueService.addJob(
    'check-cart-recovered',
    { cartId: cart.id, tenantId },
    { delay: checkDelay, jobId: `check-${cart.id}` }
  )

  console.log(
    `[ProcessCart] ✅ Carrinho ${cart.id} processado via Evolution API: ${scheduledCount} mensagens agendadas`
  )
}

export default processAbandonedCart
