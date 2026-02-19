import { Job } from 'bullmq'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import MessageTemplate from '#models/message_template'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import AbandonedCart from '#models/abandoned_cart'
import Subscription from '#models/subscription'
import whatsappOfficialService from '#services/whatsapp_official_service'
import { DateTime } from 'luxon'

export interface SendOfficialMessageData {
  officialLogId: number
  cartId: number
  templateId: number
  credentialId: number
}

/**
 * Variáveis disponíveis para templates da API Oficial:
 *   {{1}} = Nome do cliente
 *   {{2}} = Produto(s)
 *   {{3}} = Link do carrinho
 *   {{4}} = Valor total
 */
export async function sendWhatsappOfficialMessage(
  job: Job<SendOfficialMessageData>
): Promise<void> {
  const { officialLogId, cartId, templateId, credentialId } = job.data

  console.log(`[OfficialMsg] Processando envio da mensagem oficial ${officialLogId}`)

  // 1. Buscar o log
  const officialLog = await WhatsappOfficialLog.find(officialLogId)
  if (!officialLog || officialLog.status !== 'queued') {
    console.log(
      `[OfficialMsg] Log ${officialLogId} não encontrado ou status inválido (${officialLog?.status})`
    )
    return
  }

  // 2. Buscar o carrinho
  const cart = await AbandonedCart.find(cartId)
  if (!cart) {
    officialLog.status = 'failed'
    officialLog.errorMessage = 'Carrinho não encontrado'
    await officialLog.save()
    return
  }

  if (cart.status !== 'pending') {
    officialLog.status = 'failed'
    officialLog.errorMessage = `Carrinho está ${cart.status}`
    await officialLog.save()
    console.log(`[OfficialMsg] Carrinho ${cartId} não está mais pending (status: ${cart.status})`)
    return
  }

  // 3. Buscar o template unificado (deve estar aprovado na Meta)
  const template = await MessageTemplate.find(templateId)
  if (!template || template.metaStatus !== 'approved' || !template.metaTemplateId) {
    officialLog.status = 'failed'
    officialLog.errorMessage = 'Template não encontrado ou não aprovado na Meta'
    await officialLog.save()
    console.log(
      `[OfficialMsg] Template ${templateId} não encontrado ou não aprovado (metaStatus: ${template?.metaStatus})`
    )
    return
  }

  // 4. Buscar credenciais
  const credential = await WhatsappOfficialCredential.find(credentialId)
  if (!credential || !credential.isActive || credential.status !== 'active') {
    officialLog.status = 'failed'
    officialLog.errorMessage = 'Credenciais da API Oficial inativas ou inválidas'
    await officialLog.save()
    console.log(`[OfficialMsg] Credencial ${credentialId} inativa`)
    return
  }

  // 5. Verificar limite de mensagens
  const subscription = await Subscription.query().where('tenant_id', cart.tenantId).first()
  if (subscription && subscription.messagesUsed >= subscription.messagesLimit) {
    officialLog.status = 'failed'
    officialLog.errorMessage = 'Limite de mensagens atingido'
    await officialLog.save()
    return
  }

  // 6. Montar os parâmetros das variáveis do template
  // Convenção: {{1}}=nome, {{2}}=produtos, {{3}}=link, {{4}}=total
  const bodyParams = [
    cart.customerName || 'Cliente',
    formatProducts(cart.items || []),
    cart.cartUrl || '',
    formatCurrency(cart.totalValue || 0),
  ]

  try {
    console.log(
      `[OfficialMsg] Enviando template Meta "${template.metaTemplateName}" (CartBack: "${template.name}") para ${cart.customerPhone}...`
    )

    const credentials = {
      phoneNumberId: credential.phoneNumberId,
      wabaId: credential.wabaId,
      accessToken: credential.accessToken,
      webhookVerifyToken: credential.webhookVerifyToken,
    }

    const result = await whatsappOfficialService.sendTemplateMessage(credentials, {
      to: cart.customerPhone,
      templateName: template.metaTemplateName!,
      languageCode: template.metaLanguage,
      components: [
        {
          type: 'body',
          parameters: bodyParams.map((text) => ({ type: 'text', text })),
        },
      ],
    })

    // 7. Atualizar log com sucesso
    officialLog.status = 'sent'
    officialLog.metaMessageId = result?.messages?.[0]?.id || null
    officialLog.bodyParams = JSON.stringify(bodyParams)
    officialLog.sentAt = DateTime.now()
    await officialLog.save()

    // 8. Incrementar contador de mensagens
    if (subscription) {
      subscription.messagesUsed += 1
      await subscription.save()
    }

    console.log(`[OfficialMsg] ✅ Mensagem oficial ${officialLogId} enviada com sucesso`)
  } catch (error: any) {
    console.error(`[OfficialMsg] ❌ Erro ao enviar mensagem ${officialLogId}:`, error.message)

    officialLog.status = 'failed'
    officialLog.errorMessage = error.message
    await officialLog.save()

    throw error
  }
}

function formatProducts(items: any[]): string {
  if (!items || items.length === 0) return 'seus produtos'
  if (items.length === 1) return items[0].name || items[0].title || 'seu produto'
  const firstName = items[0].name || items[0].title || 'produto'
  return `${firstName} e mais ${items.length - 1} item${items.length > 2 ? 's' : ''}`
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default sendWhatsappOfficialMessage
