import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import customWebhookService from '#services/custom_webhook_service'
import evolutionApiService from '#services/evolution_api_service'
import whatsappOfficialService from '#services/whatsapp_official_service'

/**
 * Função auxiliar para adicionar delay entre envios
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Retry com backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error.message)

      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Aguardando ${delayMs}ms antes de tentar novamente...`)
        await delay(delayMs)
      }
    }
  }

  throw lastError
}

export default class WhatsappBatchSendWebhookController {
  /**
   * POST /api/webhooks/custom/:tenantUuid/whatsapp/batch-send
   * Disparo em lote de mensagens WhatsApp via webhook com controle de taxa e retry
   *
   * Headers:
   *   X-CartBack-API-Key: <api_key_da_integracao>
   *
   * Body:
   *   {
   *     "phones": ["11999999999", "11988888888"],  // Array de números
   *     "message": "Olá, tudo bem?",               // Texto da mensagem
   *     "delayBetweenMessages": 2000,              // Delay entre cada envio (ms) - padrão: 2000
   *     "maxRetries": 3                            // Tentativas por número - padrão: 3
   *   }
   *
   * Response:
   *   {
   *     "success": true,
   *     "summary": {
   *       "total": 10,
   *       "sent": 9,
   *       "failed": 1
   *     },
   *     "results": [
   *       { "phone": "11999999999", "status": "sent", "messageId": "..." },
   *       { "phone": "11988888888", "status": "failed", "error": "..." }
   *     ]
   *   }
   */
  async send({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Batch Send Webhook] Recebido disparo em lote (tenant: ${tenantUuid})`)

    // Buscar tenant ativo
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Batch Send Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
      return response.notFound({ error: 'Tenant not found' })
    }

    // Buscar integração webhook personalizada (para validar API Key)
    const integration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .where('is_active', true)
      .first()

    if (!integration) {
      console.error(
        `[Batch Send Webhook] Integração webhook não encontrada para tenant ${tenant.id}`
      )
      return response.notFound({ error: 'Webhook integration not found' })
    }

    // Validar API Key
    const apiKey = request.header('X-CartBack-API-Key')

    if (!apiKey) {
      console.error(`[Batch Send Webhook] API Key não fornecida`)
      return response.unauthorized({ error: 'Missing API Key' })
    }

    if (!integration.webhookSecret) {
      console.error(`[Batch Send Webhook] Integração sem API Key configurada`)
      return response.internalServerError({ error: 'Integration misconfigured' })
    }

    try {
      const isValid = customWebhookService.validateApiKey(apiKey, integration.webhookSecret)

      if (!isValid) {
        console.error(`[Batch Send Webhook] API Key inválida`)
        return response.unauthorized({ error: 'Invalid API Key' })
      }
    } catch (error: any) {
      console.error(`[Batch Send Webhook] Erro ao validar API Key:`, error.message)
      return response.unauthorized({ error: 'Invalid API Key' })
    }

    console.log(`[Batch Send Webhook] ✅ API Key validada`)

    // Validar parâmetros obrigatórios
    const { phones, message, delayBetweenMessages = 2000, maxRetries = 3 } = payload

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return response.badRequest({ error: 'O campo "phones" deve ser um array com ao menos um número' })
    }

    if (phones.length > 100) {
      return response.badRequest({ error: 'Máximo de 100 números por requisição' })
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return response.badRequest({ error: 'O campo "message" é obrigatório' })
    }

    // Buscar instância WhatsApp conectada do tenant (Evolution API ou API Oficial)
    const whatsappInstance = await WhatsappInstance.query()
      .where('tenant_id', tenant.id)
      .where('status', 'connected')
      .first()

    const officialCredential = !whatsappInstance
      ? await WhatsappOfficialCredential.query()
          .where('tenant_id', tenant.id)
          .where('is_active', true)
          .first()
      : null

    if (!whatsappInstance && !officialCredential) {
      console.error(
        `[Batch Send Webhook] Nenhuma instância WhatsApp conectada para tenant ${tenant.id}`
      )
      return response.unprocessableEntity({
        error: 'No connected WhatsApp instance found for this tenant',
      })
    }

    const results: Array<{
      phone: string
      status: 'sent' | 'failed'
      messageId?: string
      error?: string
      attempts?: number
    }> = []

    let sentCount = 0
    let failedCount = 0

    console.log(
      `[Batch Send Webhook] Iniciando envio para ${phones.length} números com delay de ${delayBetweenMessages}ms entre cada envio`
    )

    // Processar cada número sequencialmente com delay
    for (const [index, phone] of phones.entries()) {
      const phoneStr = String(phone).trim()

      if (!phoneStr) {
        console.warn(`[Batch Send Webhook] Número vazio no índice ${index}, pulando...`)
        results.push({
          phone: phoneStr,
          status: 'failed',
          error: 'Número vazio',
        })
        failedCount++
        continue
      }

      console.log(
        `[Batch Send Webhook] [${index + 1}/${phones.length}] Enviando para ${phoneStr}...`
      )

      try {
        // Tentar enviar com retry
        await retryWithBackoff(
          async () => {
            if (whatsappInstance) {
              // Evolution API
              const result = await evolutionApiService.sendText(
                whatsappInstance.instanceName,
                phoneStr,
                message.trim()
              )
              return result
            } else {
              // API Oficial
              const result = await whatsappOfficialService.sendTextMessage(
                {
                  phoneNumberId: officialCredential!.phoneNumberId,
                  wabaId: officialCredential!.wabaId,
                  accessToken: officialCredential!.accessToken,
                },
                phoneStr,
                message.trim()
              )
              return result
            }
          },
          maxRetries,
          1000
        )

        console.log(`[Batch Send Webhook] ✅ [${index + 1}/${phones.length}] Enviado para ${phoneStr}`)

        results.push({
          phone: phoneStr,
          status: 'sent',
          messageId: 'success',
          attempts: 1,
        })
        sentCount++
      } catch (error: any) {
        console.error(
          `[Batch Send Webhook] ❌ [${index + 1}/${phones.length}] Falha ao enviar para ${phoneStr}:`,
          error.message
        )

        results.push({
          phone: phoneStr,
          status: 'failed',
          error: error.response?.data?.message ?? error.message,
          attempts: maxRetries,
        })
        failedCount++
      }

      // Adicionar delay entre envios (exceto no último)
      if (index < phones.length - 1) {
        console.log(`[Batch Send Webhook] ⏳ Aguardando ${delayBetweenMessages}ms antes do próximo envio...`)
        await delay(delayBetweenMessages)
      }
    }

    console.log(
      `[Batch Send Webhook] ✅ Processo finalizado. Enviados: ${sentCount}, Falhados: ${failedCount}`
    )

    return response.ok({
      success: true,
      message: `Batch send completed: ${sentCount} sent, ${failedCount} failed`,
      summary: {
        total: phones.length,
        sent: sentCount,
        failed: failedCount,
      },
      results,
    })
  }
}
