import { Job } from 'bullmq'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import MessageTemplate from '#models/message_template'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import AbandonedCart from '#models/abandoned_cart'
import Subscription from '#models/subscription'
import UnifiedMessageLog from '#models/unified_message_log'
import whatsappOfficialService from '#services/whatsapp_official_service'
import { addUtmTracking } from '#utils/utm_tracking'
import { DateTime } from 'luxon'

export interface SendOfficialMessageData {
  officialLogId: number
  cartId: number
  templateId: number
  credentialId: number
}

/**
 * Variáveis disponíveis para templates (formato amigável para usuário):
 *   {{nome}} = Nome do cliente   → Convertido para {{1}} internamente
 *   {{produtos}} = Produto(s)    → Convertido para {{2}} internamente
 *   {{link}} = Link do carrinho  → Convertido para {{3}} internamente
 *   {{total}} = Valor total      → Convertido para {{4}} internamente
 *
 * O frontend exibe variáveis nomeadas, mas o backend converte para numeradas ao enviar ao Meta.
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

  // 3. Buscar o template unificado
  const template = await MessageTemplate.find(templateId)
  if (!template) {
    officialLog.status = 'failed'
    officialLog.errorMessage = 'Template não encontrado'
    await officialLog.save()
    console.log(`[OfficialMsg] Template ${templateId} não encontrado`)
    return
  }

  // Verificar se template está aprovado na Meta ou será enviado como texto
  const isApproved = template.metaStatus === 'approved' && template.metaTemplateId
  const sendAsText = !isApproved

  if (sendAsText) {
    console.log(
      `[OfficialMsg] Template ${templateId} não aprovado (status: ${template.metaStatus}), enviando como mensagem de texto`
    )
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

  // 4.1. Validar se token não expirou
  if (credential.tokenExpiresAt) {
    const now = DateTime.now()
    if (credential.tokenExpiresAt <= now) {
      const daysExpired = Math.ceil(now.diff(credential.tokenExpiresAt, 'days').days)
      officialLog.status = 'failed'
      officialLog.errorMessage = `Token de acesso expirado há ${daysExpired} dia(s). Gere um novo token permanente.`
      await officialLog.save()
      console.log(`[OfficialMsg] Token expirado para credencial ${credentialId}`)
      return
    }
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
  // Adicionar UTM tracking ao link do carrinho (usando nome do template)
  const trackedUrl = addUtmTracking(cart.cartUrl, template.name)

  // Pool de valores disponíveis
  const availableValues: Record<string, string> = {
    nome: cart.customerName || 'Cliente',
    produtos: formatProducts(cart.items || []),
    link: trackedUrl || '',
    total: formatCurrency(cart.totalValue || 0),
  }

  // Usar variableMapping para montar parâmetros na ordem correta
  let allParams: string[]

  if (template.variableMapping) {
    // Template tem mapeamento dinâmico - usar ele
    console.log(`[OfficialMsg] Usando variableMapping:`, template.variableMapping)

    // Criar array com o tamanho correto
    const maxIndex = Math.max(...Object.values(template.variableMapping))
    allParams = new Array(maxIndex)

    // Preencher cada posição baseado no mapeamento
    // Ex: {link: 1, total: 2, nome: 3} → allParams[0] = link, allParams[1] = total, allParams[2] = nome
    Object.entries(template.variableMapping).forEach(([varName, index]) => {
      allParams[index - 1] = availableValues[varName] || ''
    })
  } else {
    // Fallback: ordem fixa antiga (compatibilidade com templates antigos)
    console.log(`[OfficialMsg] Template sem variableMapping, usando ordem fixa padrão`)
    allParams = [
      availableValues.nome,
      availableValues.produtos,
      availableValues.link,
      availableValues.total,
    ]
  }

  // Criar log unificado ANTES de enviar
  const unifiedLog = await UnifiedMessageLog.logOfficialSend({
    tenantId: cart.tenantId,
    customerPhone: cart.customerPhone,
    customerName: cart.customerName,
    abandonedCartId: cart.id,
    messageTemplateId: template.id,
    templateName: template.name,
    officialCredentialId: credential.id,
    messageType: sendAsText ? 'text' : 'template',
    templateVariables: {
      nome: availableValues.nome,
      produtos: availableValues.produtos,
      link: availableValues.link,
      total: availableValues.total,
    },
    metadata: {
      officialLogId: officialLog.id,
      source: 'abandoned_cart_recovery',
      isApproved: !sendAsText,
      metaTemplateId: template.metaTemplateId,
    },
  })

  try {
    const credentials = {
      phoneNumberId: credential.phoneNumberId,
      wabaId: credential.wabaId,
      accessToken: credential.accessToken,
      webhookVerifyToken: credential.webhookVerifyToken,
    }

    let result: any

    if (sendAsText) {
      // Enviar como mensagem de texto (template não aprovado)
      let textMessage = template.content || template.bodyText || ''

      // Substituir variáveis Evolution {{nome}}, {{produtos}}, etc.
      textMessage = textMessage
        .replace(/\{\{nome\}\}/g, allParams[0])
        .replace(/\{\{produtos\}\}/g, allParams[1])
        .replace(/\{\{link\}\}/g, allParams[2])
        .replace(/\{\{total\}\}/g, allParams[3])

      // Substituir variáveis Meta {{1}}, {{2}}, {{3}}, {{4}}
      textMessage = textMessage
        .replace(/\{\{1\}\}/g, allParams[0])
        .replace(/\{\{2\}\}/g, allParams[1])
        .replace(/\{\{3\}\}/g, allParams[2])
        .replace(/\{\{4\}\}/g, allParams[3])

      console.log(
        `[OfficialMsg] Enviando como TEXTO (template "${template.name}" não aprovado) para ${cart.customerPhone}`
      )

      result = await whatsappOfficialService.sendTextMessage(
        credentials,
        cart.customerPhone,
        textMessage
      )
    } else {
      // Enviar como template Meta aprovado
      // Detectar quantas variáveis o template tem baseado em meta_components
      let paramCount = 4 // Default

      if (template.metaComponents) {
        try {
          const components = typeof template.metaComponents === 'string'
            ? JSON.parse(template.metaComponents)
            : template.metaComponents

          const bodyComponent = components.find((c: any) => c.type === 'BODY')
          if (bodyComponent?.text) {
            // Contar variáveis {{1}}, {{2}}, etc. no texto
            const matches = bodyComponent.text.match(/\{\{\d+\}\}/g) || []
            const maxIndex = matches
              .map((m: string) => parseInt(m.replace(/\D/g, '')))
              .reduce((max: number, num: number) => Math.max(max, num), 0)

            paramCount = maxIndex
            console.log(`[OfficialMsg] Template "${template.name}" tem ${paramCount} variáveis`)
          }
        } catch (error) {
          console.error('[OfficialMsg] Erro ao parsear meta_components, usando 4 params:', error)
        }
      }

      // Enviar apenas os parâmetros que o template usa
      const bodyParams = allParams.slice(0, paramCount)

      console.log(
        `[OfficialMsg] Enviando template Meta "${template.metaTemplateName}" (CartBack: "${template.name}") para ${cart.customerPhone}...`
      )
      console.log(`[OfficialMsg] Parâmetros (${bodyParams.length}):`, bodyParams)

      result = await whatsappOfficialService.sendTemplateMessage(credentials, {
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

      // Atualizar log unificado
      await unifiedLog.markAsSent(result?.messages?.[0]?.id)
    } else {
      // Para mensagens de texto, salvar allParams
      officialLog.status = 'sent'
      officialLog.metaMessageId = result?.messages?.[0]?.id || null
      officialLog.bodyParams = JSON.stringify(allParams)
      officialLog.sentAt = DateTime.now()
      await officialLog.save()

      // Atualizar log unificado
      await unifiedLog.markAsSent(result?.messages?.[0]?.id)
    }

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

    // Atualizar log unificado com falha
    await unifiedLog.markAsFailed(error.message, error.response?.data?.error?.code?.toString())

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
