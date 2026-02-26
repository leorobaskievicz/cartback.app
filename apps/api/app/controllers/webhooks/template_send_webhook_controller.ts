import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import MessageTemplate from '#models/message_template'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import customWebhookService from '#services/custom_webhook_service'
import evolutionApiService from '#services/evolution_api_service'
import whatsappOfficialService from '#services/whatsapp_official_service'
import { DateTime } from 'luxon'

export default class TemplateSendWebhookController {
  /**
   * POST /api/webhooks/custom/:tenantUuid/template/send
   * Disparo de template manual via webhook
   *
   * Headers:
   *   X-CartBack-API-Key: <api_key_da_integracao>
   *
   * Body:
   *   {
   *     "template_id": 123,                           // ID do template (ou template_name)
   *     "template_name": "Boas vindas",              // Nome do template (alternativa ao ID)
   *     "phone": "5541999999999",                    // Número destino (com código do país)
   *     "variables": {                               // Variáveis do template
   *       "nome": "João Silva",
   *       "produtos": "Produto X",
   *       "link": "https://loja.com",
   *       "total": "R$ 100,00"
   *     }
   *   }
   */
  async send({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Template Send Webhook] Recebido disparo de template (tenant: ${tenantUuid})`)

    // Buscar tenant ativo
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Template Send Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
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
        `[Template Send Webhook] Integração webhook não encontrada para tenant ${tenant.id}`
      )
      return response.notFound({ error: 'Webhook integration not found' })
    }

    // Validar API Key
    const apiKey = request.header('X-CartBack-API-Key')

    if (!apiKey) {
      console.error(`[Template Send Webhook] API Key não fornecida`)
      return response.unauthorized({ error: 'Missing API Key' })
    }

    if (!integration.webhookSecret) {
      console.error(`[Template Send Webhook] Integração sem API Key configurada`)
      return response.internalServerError({ error: 'Integration misconfigured' })
    }

    try {
      const isValid = customWebhookService.validateApiKey(apiKey, integration.webhookSecret)

      if (!isValid) {
        console.error(`[Template Send Webhook] API Key inválida`)
        return response.unauthorized({ error: 'Invalid API Key' })
      }
    } catch (error: any) {
      console.error(`[Template Send Webhook] Erro ao validar API Key:`, error.message)
      return response.unauthorized({ error: 'Invalid API Key' })
    }

    console.log(`[Template Send Webhook] ✅ API Key validada`)

    // Validar parâmetros obrigatórios
    const { template_id, template_name, phone, variables } = payload

    if (!template_id && !template_name) {
      return response.badRequest({
        error: 'É necessário fornecer "template_id" ou "template_name"',
      })
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return response.badRequest({ error: 'O campo "phone" é obrigatório' })
    }

    // Buscar template
    let template: MessageTemplate | null = null

    if (template_id) {
      template = await MessageTemplate.query()
        .where('id', template_id)
        .where('tenant_id', tenant.id)
        .where('trigger_type', 'manual')
        .first()
    } else {
      template = await MessageTemplate.query()
        .where('name', template_name)
        .where('tenant_id', tenant.id)
        .where('trigger_type', 'manual')
        .first()
    }

    if (!template) {
      console.error(
        `[Template Send Webhook] Template não encontrado (id: ${template_id}, name: ${template_name})`
      )
      return response.notFound({
        error: 'Template not found or is not a manual trigger type',
      })
    }

    if (!template.isActive) {
      console.error(`[Template Send Webhook] Template ${template.id} está inativo`)
      return response.unprocessableEntity({ error: 'Template is inactive' })
    }

    console.log(`[Template Send Webhook] Template encontrado: ${template.name} (ID: ${template.id})`)

    // Preparar variáveis
    const vars = variables || {}

    // Substituir variáveis no content do template
    let messageText = template.content || ''

    // Substituir variáveis nomeadas
    messageText = messageText
      .replace(/\{\{nome\}\}/g, vars.nome || '')
      .replace(/\{\{produtos\}\}/g, vars.produtos || '')
      .replace(/\{\{link\}\}/g, vars.link || '')
      .replace(/\{\{total\}\}/g, vars.total || '')

    // Se tiver variableMapping (templates Meta), também substituir variáveis numeradas
    if (template.variableMapping) {
      Object.entries(template.variableMapping).forEach(([varName, index]) => {
        const regex = new RegExp(`\\{\\{${index}\\}\\}`, 'g')
        messageText = messageText.replace(regex, vars[varName] || '')
      })
    }

    console.log(`[Template Send Webhook] Mensagem processada: ${messageText.substring(0, 100)}...`)

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
        `[Template Send Webhook] Nenhuma instância WhatsApp conectada para tenant ${tenant.id}`
      )
      return response.unprocessableEntity({
        error: 'No connected WhatsApp instance found for this tenant',
      })
    }

    try {
      let messageId: string | null = null

      if (whatsappInstance) {
        // Evolution API
        console.log(
          `[Template Send Webhook] Enviando template para ${phone} via Evolution API (${whatsappInstance.instanceName})`
        )
        const result = await evolutionApiService.sendText(
          whatsappInstance.instanceName,
          phone.trim(),
          messageText
        )
        messageId = result?.key?.id ?? null
        console.log(`[Template Send Webhook] ✅ Template enviado com sucesso para ${phone}`)

        return response.ok({
          success: true,
          message: 'Template sent successfully',
          data: {
            phone: phone.trim(),
            template_id: template.id,
            template_name: template.name,
            instance: whatsappInstance.instanceName,
            messageId,
          },
        })
      } else {
        // API Oficial do WhatsApp
        console.log(`[Template Send Webhook] Enviando template para ${phone} via API Oficial`)

        const credentials = {
          phoneNumberId: officialCredential!.phoneNumberId,
          wabaId: officialCredential!.wabaId,
          accessToken: officialCredential!.accessToken,
        }

        // Verificar se template está aprovado pela Meta
        if (template.metaStatus === 'approved' && template.metaTemplateId && template.metaTemplateName) {
          console.log(`[Template Send Webhook] Template aprovado, enviando via template Meta`)

          // Construir parâmetros baseado no variableMapping
          let bodyParams: string[] = []

          if (template.variableMapping) {
            const maxIndex = Math.max(...Object.values(template.variableMapping))
            bodyParams = new Array(maxIndex)

            Object.entries(template.variableMapping).forEach(([varName, index]) => {
              bodyParams[index - 1] = vars[varName] || ''
            })
          }

          const result = await whatsappOfficialService.sendTemplateMessage(credentials, {
            to: phone.trim(),
            templateName: template.metaTemplateName,
            languageCode: template.metaLanguage || 'pt_BR',
            components:
              bodyParams.length > 0
                ? [
                    {
                      type: 'body',
                      parameters: bodyParams.map((text) => ({ type: 'text', text })),
                    },
                  ]
                : undefined,
          })

          messageId = result?.messages?.[0]?.id ?? null

          // Criar log na tabela whatsapp_official_logs
          await WhatsappOfficialLog.create({
            tenantId: tenant.id,
            officialTemplateId: template.id,
            abandonedCartId: null,
            templateName: template.metaTemplateName,
            recipientPhone: phone.trim(),
            recipientName: vars.nome || 'Manual',
            languageCode: template.metaLanguage || 'pt_BR',
            messageType: 'template',
            status: 'sent',
            metaMessageId: messageId,
            bodyParams: JSON.stringify(bodyParams),
            sentAt: DateTime.now(),
          })
        } else {
          // Template não aprovado, enviar como texto
          console.log(`[Template Send Webhook] Template não aprovado, enviando como texto`)

          const result = await whatsappOfficialService.sendTextMessage(
            credentials,
            phone.trim(),
            messageText
          )

          messageId = result?.messages?.[0]?.id ?? null

          // Criar log
          await WhatsappOfficialLog.create({
            tenantId: tenant.id,
            officialTemplateId: template.id,
            abandonedCartId: null,
            templateName: template.name,
            recipientPhone: phone.trim(),
            recipientName: vars.nome || 'Manual',
            languageCode: template.metaLanguage || 'pt_BR',
            messageType: 'text',
            status: 'sent',
            metaMessageId: messageId,
            bodyParams: JSON.stringify(vars),
            sentAt: DateTime.now(),
          })
        }

        console.log(`[Template Send Webhook] ✅ Template enviado via API Oficial para ${phone}`)

        return response.ok({
          success: true,
          message: 'Template sent successfully',
          data: {
            phone: phone.trim(),
            template_id: template.id,
            template_name: template.name,
            messageId,
          },
        })
      }
    } catch (error: any) {
      console.error(`[Template Send Webhook] Erro ao enviar template:`, error.message)

      return response.internalServerError({
        error: 'Failed to send template',
        details: error.response?.data?.message ?? error.message,
      })
    }
  }
}
