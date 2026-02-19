import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import MessageTemplate from '#models/message_template'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import evolutionApiService from '#services/evolution_api_service'
import whatsappOfficialService from '#services/whatsapp_official_service'
import planService from '#services/plan_service'
import {
  createMessageTemplateValidator,
  updateMessageTemplateValidator,
  reorderTemplatesValidator,
} from '#validators/message_template'
import vine from '@vinejs/vine'

export default class MessageTemplatesController {
  /**
   * GET /api/templates
   * Lista todos os templates do tenant
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const templates = await MessageTemplate.query()
      .where('tenant_id', tenant.id)
      .orderBy('sort_order', 'asc')

    return response.ok({
      success: true,
      data: templates,
    })
  }

  /**
   * POST /api/templates
   * Cria novo template
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    // Verificar limite de templates
    const canCreate = await planService.canCreateTemplate(user.tenantId)
    if (!canCreate.allowed) {
      return response.paymentRequired({
        success: false,
        error: `Limite de templates atingido (${canCreate.current}/${canCreate.limit}). Faça upgrade do plano.`,
        code: 'TEMPLATE_LIMIT_REACHED',
      })
    }

    const data = await createMessageTemplateValidator.validate(request.all())

    // Buscar maior sort_order
    const maxSortOrder = await MessageTemplate.query()
      .where('tenant_id', tenant.id)
      .max('sort_order as max')
      .firstOrFail()

    const template = await MessageTemplate.create({
      tenantId: tenant.id,
      name: data.name,
      triggerType: data.triggerType || 'abandoned_cart',
      delayMinutes: data.delayMinutes,
      content: data.content,
      isActive: data.isActive ?? true,
      sortOrder: (maxSortOrder.$extras.max || 0) + 1,
    })

    return response.created({
      success: true,
      data: template,
    })
  }

  /**
   * PUT /api/templates/:id
   * Atualiza template
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)
    const data = await updateMessageTemplateValidator.validate(request.all())

    const template = await MessageTemplate.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    template.merge(data)
    await template.save()

    return response.ok({
      success: true,
      data: template,
    })
  }

  /**
   * DELETE /api/templates/:id
   * Remove template
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const template = await MessageTemplate.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    await template.delete()

    return response.ok({
      success: true,
      data: { message: 'Template deleted successfully' },
    })
  }

  /**
   * PUT /api/templates/reorder
   * Reordena templates (atualiza sort_order)
   */
  async reorder({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)
    const { templates } = await reorderTemplatesValidator.validate(request.all())

    // Atualizar sort_order de cada template
    for (const item of templates) {
      await MessageTemplate.query()
        .where('id', item.id)
        .where('tenant_id', tenant.id)
        .update({ sort_order: item.sortOrder })
    }

    return response.ok({
      success: true,
      data: { message: 'Templates reordered successfully' },
    })
  }

  /**
   * POST /api/templates/:id/test
   * Envia mensagem de teste do template para um número de WhatsApp
   */
  async test({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    // Validar phoneNumber
    const testTemplateValidator = vine.compile(
      vine.object({
        phoneNumber: vine.string().trim().minLength(10),
      })
    )
    const { phoneNumber } = await testTemplateValidator.validate(request.all())

    // Buscar template
    const template = await MessageTemplate.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    // Verificar se WhatsApp está conectado (Evolution API ou API Oficial)
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
      return response.badRequest({
        success: false,
        error: {
          code: 'WHATSAPP_NOT_CONNECTED',
          message: 'WhatsApp não está conectado. Conecte seu WhatsApp antes de testar.',
        },
      })
    }

    try {
      // Substituir variáveis com dados de exemplo
      const testMessage = template.content
        .replace(/\{\{nome\}\}/g, 'João Silva')
        .replace(/\{\{produtos\}\}/g, '• Produto 1 - R$ 199,90\n• Produto 2 - R$ 99,90')
        .replace(/\{\{link\}\}/g, 'https://sua-loja.com/carrinho/abc123')
        .replace(/\{\{total\}\}/g, 'R$ 299,90')

      // Adicionar cabeçalho indicando que é teste
      const messageWithHeader = `🧪 *MENSAGEM DE TESTE*\n\n${testMessage}\n\n_Esta é uma mensagem de teste do template "${template.name}"_`

      if (whatsappInstance) {
        // Enviar via Evolution API
        console.log(`📤 Sending test message from template "${template.name}" to ${phoneNumber} via Evolution API`)
        await evolutionApiService.sendText(whatsappInstance.instanceName, phoneNumber, messageWithHeader)
      } else {
        // Enviar via API Oficial
        console.log(`📤 Sending test message from template "${template.name}" to ${phoneNumber} via Official API`)
        await whatsappOfficialService.sendTextMessage(
          {
            phoneNumberId: officialCredential!.phoneNumberId,
            wabaId: officialCredential!.wabaId,
            accessToken: officialCredential!.accessToken,
          },
          phoneNumber,
          messageWithHeader
        )
      }

      console.log(`✅ Test message sent successfully`)

      return response.ok({
        success: true,
        data: {
          message: 'Mensagem de teste enviada com sucesso!',
          phoneNumber,
          templateName: template.name,
        },
      })
    } catch (error: any) {
      console.error('❌ Error sending test message:', error)

      return response.badRequest({
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: 'Erro ao enviar mensagem de teste',
          details: error.response?.data || error.message,
        },
      })
    }
  }
}
