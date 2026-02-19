import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import customWebhookService from '#services/custom_webhook_service'
import evolutionApiService from '#services/evolution_api_service'
import whatsappOfficialService from '#services/whatsapp_official_service'

export default class WhatsappSendWebhookController {
  /**
   * POST /api/webhooks/custom/:tenantUuid/whatsapp/send
   * Disparo simples de mensagem WhatsApp via webhook
   *
   * Headers:
   *   X-CartBack-API-Key: <api_key_da_integracao>
   *
   * Body:
   *   {
   *     "phone": "11999999999",       // Número destino (com ou sem código do país)
   *     "message": "Olá, tudo bem?"  // Texto da mensagem
   *   }
   */
  async send({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[WhatsApp Send Webhook] Recebido disparo de mensagem (tenant: ${tenantUuid})`)

    // Buscar tenant ativo
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[WhatsApp Send Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
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
        `[WhatsApp Send Webhook] Integração webhook não encontrada para tenant ${tenant.id}`
      )
      return response.notFound({ error: 'Webhook integration not found' })
    }

    // Validar API Key
    const apiKey = request.header('X-CartBack-API-Key')

    if (!apiKey) {
      console.error(`[WhatsApp Send Webhook] API Key não fornecida`)
      return response.unauthorized({ error: 'Missing API Key' })
    }

    if (!integration.webhookSecret) {
      console.error(`[WhatsApp Send Webhook] Integração sem API Key configurada`)
      return response.internalServerError({ error: 'Integration misconfigured' })
    }

    try {
      const isValid = customWebhookService.validateApiKey(apiKey, integration.webhookSecret)

      if (!isValid) {
        console.error(`[WhatsApp Send Webhook] API Key inválida`)
        return response.unauthorized({ error: 'Invalid API Key' })
      }
    } catch (error: any) {
      console.error(`[WhatsApp Send Webhook] Erro ao validar API Key:`, error.message)
      return response.unauthorized({ error: 'Invalid API Key' })
    }

    console.log(`[WhatsApp Send Webhook] ✅ API Key validada`)

    // Validar parâmetros obrigatórios
    const { phone, message } = payload

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return response.badRequest({ error: 'O campo "phone" é obrigatório' })
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
        `[WhatsApp Send Webhook] Nenhuma instância WhatsApp conectada para tenant ${tenant.id}`
      )
      return response.unprocessableEntity({
        error: 'No connected WhatsApp instance found for this tenant',
      })
    }

    // Enviar mensagem
    try {
      if (whatsappInstance) {
        console.log(
          `[WhatsApp Send Webhook] Enviando mensagem para ${phone} via Evolution API (instância ${whatsappInstance.instanceName})`
        )

        const result = await evolutionApiService.sendText(
          whatsappInstance.instanceName,
          phone.trim(),
          message.trim()
        )

        console.log(`[WhatsApp Send Webhook] ✅ Mensagem enviada com sucesso para ${phone}`)

        return response.ok({
          success: true,
          message: 'Message sent successfully',
          data: {
            phone: phone.trim(),
            instance: whatsappInstance.instanceName,
            messageId: result?.key?.id ?? null,
          },
        })
      } else {
        console.log(
          `[WhatsApp Send Webhook] Enviando mensagem para ${phone} via API Oficial`
        )

        const result = await whatsappOfficialService.sendTextMessage(
          {
            phoneNumberId: officialCredential!.phoneNumberId,
            wabaId: officialCredential!.wabaId,
            accessToken: officialCredential!.accessToken,
          },
          phone.trim(),
          message.trim()
        )

        console.log(`[WhatsApp Send Webhook] ✅ Mensagem enviada com sucesso para ${phone} via API Oficial`)

        return response.ok({
          success: true,
          message: 'Message sent successfully',
          data: {
            phone: phone.trim(),
            messageId: result?.messages?.[0]?.id ?? null,
          },
        })
      }
    } catch (error: any) {
      console.error(`[WhatsApp Send Webhook] Erro ao enviar mensagem:`, error.message)

      return response.internalServerError({
        error: 'Failed to send WhatsApp message',
        details: error.response?.data?.message ?? error.message,
      })
    }
  }
}
