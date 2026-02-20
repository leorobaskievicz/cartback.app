import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import MessageTemplate from '#models/message_template'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import evolutionApiService from '#services/evolution_api_service'
import whatsappOfficialService from '#services/whatsapp_official_service'
import templateSyncService from '#services/template_sync_service'
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

    // Se metaMode=true, construir components Meta e content do bodyText
    let metaComponents = null
    let content = data.content || ''

    if (data.metaMode && data.bodyText) {
      // Modo Meta: construir components completos
      const components: any[] = []

      // HEADER
      if (data.headerType && data.headerType !== 'NONE') {
        const headerComponent: any = { type: 'HEADER' }

        if (data.headerType === 'TEXT') {
          headerComponent.format = 'TEXT'
          headerComponent.text = data.headerText || ''
          // Se tem variável {{1}} no header, adicionar example
          if (data.headerText?.includes('{{1}}')) {
            headerComponent.example = { header_text: ['Exemplo Header'] }
          }
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(data.headerType)) {
          headerComponent.format = data.headerType
          if (data.headerMediaUrl) {
            headerComponent.example = {
              header_handle: [data.headerMediaUrl],
            }
          }
        }

        components.push(headerComponent)
      }

      // BODY (obrigatório)
      const bodyComponent: any = {
        type: 'BODY',
        text: data.bodyText,
      }

      // Extrair variáveis {{1}}, {{2}}... e gerar examples
      const variableMatches = [...data.bodyText.matchAll(/\{\{(\d+)\}\}/g)]
      if (variableMatches.length > 0) {
        const examples = [
          'João',
          'Produto X e mais 2 itens',
          'https://loja.com/cart/123',
          'R$ 149,90',
        ]
        bodyComponent.example = {
          body_text: [examples.slice(0, variableMatches.length)],
        }
      }

      components.push(bodyComponent)

      // FOOTER
      if (data.footerText) {
        components.push({
          type: 'FOOTER',
          text: data.footerText,
        })
      }

      // BUTTONS
      if (data.buttons && data.buttons.length > 0) {
        const buttonComponent: any = {
          type: 'BUTTONS',
          buttons: data.buttons.map((btn: any) => {
            const button: any = { type: btn.type, text: btn.text }
            if (btn.type === 'URL' && btn.url) {
              button.url = btn.url
            } else if (btn.type === 'PHONE_NUMBER' && btn.phoneNumber) {
              button.phone_number = btn.phoneNumber
            }
            return button
          }),
        }
        components.push(buttonComponent)
      }

      metaComponents = components
      content = data.bodyText // Salvar bodyText como content também
    }

    const template = await MessageTemplate.create({
      tenantId: tenant.id,
      name: data.name,
      triggerType: data.triggerType || 'abandoned_cart',
      delayMinutes: data.delayMinutes,
      content,
      isActive: data.isActive ?? true,
      sortOrder: (maxSortOrder.$extras.max || 0) + 1,
      metaStatus: 'not_synced',
      metaLanguage: data.metaLanguage || 'pt_BR',
      metaCategory: data.metaCategory || 'MARKETING',
      metaComponents,
    })

    // Auto-sync com Meta se API Oficial está ativa
    const officialCredential = await WhatsappOfficialCredential.query()
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .first()

    if (officialCredential) {
      try {
        await templateSyncService.syncTemplateToMeta(template, officialCredential)
        console.log(`✅ Template ${template.id} auto-synced to Meta`)
      } catch (error) {
        console.error(`⚠️ Failed to auto-sync template to Meta:`, error)
        // Não falhar a criação do template, apenas logar erro
      }
    }

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
   * POST /api/templates/sync
   * Sincronização completa bidirecional com Meta WhatsApp Official API
   */
  async sync({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    try {
      const result = await templateSyncService.fullSync(tenant.id)

      return response.ok({
        success: true,
        data: {
          message: 'Template sync completed successfully',
          sentToMeta: result.sentToMeta,
          importedFromMeta: result.importedFromMeta,
          updated: result.updated,
        },
      })
    } catch (error: any) {
      console.error('Template sync failed:', error)
      console.error('Error stack:', error.stack)
      console.error('Error details:', JSON.stringify(error, null, 2))

      return response.badRequest({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: error.message || error.toString() || 'Failed to sync templates',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      })
    }
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
      let metaMessageId: string | null = null

      if (whatsappInstance) {
        // ========== EVOLUTION API ==========
        const testMessage = template.content
          .replace(/\{\{nome\}\}/g, 'João Silva')
          .replace(/\{\{produtos\}\}/g, '• Produto 1 - R$ 199,90\n• Produto 2 - R$ 99,90')
          .replace(/\{\{link\}\}/g, 'https://sua-loja.com/carrinho/abc123')
          .replace(/\{\{total\}\}/g, 'R$ 299,90')

        const messageWithHeader = `🧪 *MENSAGEM DE TESTE*\n\n${testMessage}\n\n_Esta é uma mensagem de teste do template "${template.name}"_`

        console.log(
          `📤 Sending test message from template "${template.name}" to ${phoneNumber} via Evolution API`
        )
        await evolutionApiService.sendText(whatsappInstance.instanceName, phoneNumber, messageWithHeader)
      } else {
        // ========== META WHATSAPP OFFICIAL API ==========
        console.log(
          `📤 Sending test message from template "${template.name}" to ${phoneNumber} via Official API`
        )

        const credentials = {
          phoneNumberId: officialCredential!.phoneNumberId,
          wabaId: officialCredential!.wabaId,
          accessToken: officialCredential!.accessToken,
        }

        // Se template está aprovado pela Meta, usa sendTemplateMessage
        if (template.metaStatus === 'approved' && template.metaTemplateId && template.metaTemplateName) {
          console.log(`✅ Template approved, sending via Meta template: ${template.metaTemplateName}`)

          // Dados de exemplo para variáveis
          const exampleParams = ['João Silva', 'Produto X e mais 2 itens', 'R$ 149,90', 'https://loja.com/cart/123']

          const result = await whatsappOfficialService.sendTemplateMessage(credentials, {
            to: phoneNumber,
            templateName: template.metaTemplateName,
            languageCode: template.metaLanguage || 'pt_BR',
            components: [
              {
                type: 'body',
                parameters: exampleParams.map((text) => ({ type: 'text', text })),
              },
            ],
          })

          metaMessageId = result.messages?.[0]?.id || null
        } else {
          // Template não aprovado ou não sincronizado, envia como texto
          console.log(`⚠️ Template not approved, sending as text message`)

          const testMessage = template.content
            .replace(/\{\{nome\}\}/g, 'João Silva')
            .replace(/\{\{produtos\}\}/g, 'Produto X e mais 2 itens')
            .replace(/\{\{link\}\}/g, 'https://loja.com/cart/123')
            .replace(/\{\{total\}\}/g, 'R$ 149,90')
            // Também suporta variáveis Meta {{1}}, {{2}}...
            .replace(/\{\{1\}\}/g, 'João Silva')
            .replace(/\{\{2\}\}/g, 'Produto X e mais 2 itens')
            .replace(/\{\{3\}\}/g, 'R$ 149,90')
            .replace(/\{\{4\}\}/g, 'https://loja.com/cart/123')

          const messageWithHeader = `🧪 *MENSAGEM DE TESTE*\n\n${testMessage}\n\n_Template: "${template.name}"_`

          const result = await whatsappOfficialService.sendTextMessage(credentials, phoneNumber, messageWithHeader)
          metaMessageId = result.messages?.[0]?.id || null
        }

        // Criar log na tabela whatsapp_official_logs
        const WhatsappOfficialLog = (await import('#models/whatsapp_official_log')).default

        await WhatsappOfficialLog.create({
          tenantId: tenant.id,
          officialTemplateId: null, // Não é um envio automático
          abandonedCartId: null,
          templateName: template.metaTemplateName || template.name,
          recipientPhone: phoneNumber,
          recipientName: 'João Silva (TESTE)',
          languageCode: template.metaLanguage || 'pt_BR',
          messageType: template.metaStatus === 'approved' ? 'template' : 'text',
          status: 'sent',
          metaMessageId,
          bodyParams: '["João Silva", "Produto X", "R$ 149,90", "https://loja.com/cart/123"]',
          sentAt: DateTime.now(),
        })

        console.log(`📝 Log created in whatsapp_official_logs`)
      }

      console.log(`✅ Test message sent successfully`)

      return response.ok({
        success: true,
        data: {
          message: 'Mensagem de teste enviada com sucesso!',
          phoneNumber,
          templateName: template.name,
          sentVia: whatsappInstance ? 'Evolution API' : 'Meta Official API',
          usedMetaTemplate: !whatsappInstance && template.metaStatus === 'approved',
        },
      })
    } catch (error: any) {
      console.error('❌ Error sending test message:', error)
      console.error('Error details:', error.response?.data || error.message)

      return response.badRequest({
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: error.response?.data?.error?.message || error.message || 'Erro ao enviar mensagem de teste',
          details: error.response?.data || error.message,
        },
      })
    }
  }
}
