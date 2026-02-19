import type { HttpContext } from '@adonisjs/core/http'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import { DateTime } from 'luxon'

export default class WhatsappOfficialWebhookController {
  /**
   * GET /api/webhooks/whatsapp-official/:tenantUuid
   * Verificação do webhook pela Meta (challenge)
   */
  async verify({ params, request, response }: HttpContext) {
    const mode = request.input('hub.mode')
    const token = request.input('hub.verify_token')
    const challenge = request.input('hub.challenge')

    // Buscar tenant pelo UUID
    const { default: Tenant } = await import('#models/tenant')
    const tenant = await Tenant.query().where('uuid', params.tenantUuid).first()

    if (!tenant) {
      console.warn(`WhatsApp Official Webhook verify: tenant not found for UUID ${params.tenantUuid}`)
      return response.forbidden({ error: 'Tenant not found' })
    }

    // Buscar credenciais do tenant
    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', tenant.id)
      .first()

    if (!credential) {
      return response.forbidden({ error: 'Credentials not configured' })
    }

    if (mode === 'subscribe' && token === credential.webhookVerifyToken) {
      console.log(`✅ WhatsApp Official Webhook verified for tenant ${tenant.id}`)
      return response.ok(Number(challenge))
    }

    console.warn(`❌ WhatsApp Official Webhook verification failed for tenant ${tenant.id}`)
    return response.forbidden({ error: 'Verification failed' })
  }

  /**
   * POST /api/webhooks/whatsapp-official/:tenantUuid
   * Recebe eventos do WhatsApp via Meta (status de mensagens, mensagens recebidas)
   */
  async handle({ params, request, response }: HttpContext) {
    const payload = request.body()

    console.log('🔔 WhatsApp Official Webhook Received:')
    console.log(JSON.stringify(payload, null, 2))

    try {
      // Buscar tenant pelo UUID
      const { default: Tenant } = await import('#models/tenant')
      const tenant = await Tenant.query().where('uuid', params.tenantUuid).first()

      if (!tenant) {
        return response.ok({ success: true }) // Sempre retornar 200 para a Meta
      }

      // Processar cada entrada do webhook
      const entries = payload.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          if (change.field !== 'messages') continue

          const value = change.value

          // Processar status de mensagens
          if (value?.statuses) {
            for (const statusUpdate of value.statuses) {
              await this.processMessageStatus(tenant.id, statusUpdate)
            }
          }

          // Processar mensagens recebidas (respostas de clientes)
          if (value?.messages) {
            for (const message of value.messages) {
              console.log(`📩 Message received from ${message.from}: ${message.type}`)
              // Futuramente: salvar respostas e atualizar métricas de resposta
            }
          }
        }
      }

      return response.ok({ success: true })
    } catch (error) {
      console.error('❌ Error processing WhatsApp Official webhook:', error)
      // Sempre retornar 200 para a Meta não reenviar
      return response.ok({ success: true })
    }
  }

  /**
   * Processa atualização de status de mensagem
   */
  private async processMessageStatus(tenantId: number, statusUpdate: any) {
    const { id: messageId, status, timestamp, errors } = statusUpdate

    if (!messageId) return

    const log = await WhatsappOfficialLog.query()
      .where('tenant_id', tenantId)
      .where('meta_message_id', messageId)
      .first()

    if (!log) {
      console.warn(`⚠️  Log not found for message ID: ${messageId}`)
      return
    }

    const statusMap: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    }

    const newStatus = statusMap[status]
    if (!newStatus) return

    log.status = newStatus

    const ts = timestamp ? DateTime.fromSeconds(Number(timestamp)) : DateTime.now()

    if (status === 'sent') log.sentAt = ts
    if (status === 'delivered') log.deliveredAt = ts
    if (status === 'read') log.readAt = ts
    if (status === 'failed') {
      const errorInfo = errors?.[0]
      log.errorMessage = errorInfo?.title || 'Falha no envio'
      log.errorCode = errorInfo?.code || null
    }

    await log.save()
    console.log(`📊 Message ${messageId} status updated to: ${status}`)
  }
}
