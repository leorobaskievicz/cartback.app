import type { HttpContext } from '@adonisjs/core/http'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import WhatsappOfficialTemplate from '#models/whatsapp_official_template'
import whatsappOfficialService from '#services/whatsapp_official_service'
import {
  createOfficialTemplateValidator,
} from '#validators/whatsapp_official'
import { DateTime } from 'luxon'

export default class WhatsappOfficialTemplatesController {
  /**
   * GET /api/whatsapp-official/templates
   * Lista todos os templates do tenant (banco local + status da Meta)
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const templates = await WhatsappOfficialTemplate.query()
      .where('tenant_id', user.tenantId)
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: templates,
    })
  }

  /**
   * GET /api/whatsapp-official/templates/:id
   * Retorna detalhes de um template
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const template = await WhatsappOfficialTemplate.query()
      .where('tenant_id', user.tenantId)
      .where('id', params.id)
      .firstOrFail()

    return response.ok({
      success: true,
      data: template,
    })
  }

  /**
   * POST /api/whatsapp-official/templates
   * Cria um novo template na Meta e salva no banco
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .where('is_active', true)
      .first()

    if (!credential) {
      return response.badRequest({
        success: false,
        error: {
          code: 'NO_CREDENTIALS',
          message: 'Configure as credenciais da API Oficial antes de criar templates.',
        },
      })
    }

    const data = await createOfficialTemplateValidator.validate(request.all())

    // Extrair campos do body/header para facilitar busca
    const bodyComponent = data.components.find((c: any) => c.type === 'BODY')
    const headerComponent = data.components.find((c: any) => c.type === 'HEADER')
    const footerComponent = data.components.find((c: any) => c.type === 'FOOTER')
    const buttonsComponent = data.components.find((c: any) => c.type === 'BUTTONS')

    try {
      // Criar na Meta API
      const metaResult = await whatsappOfficialService.createTemplate(
        { phoneNumberId: credential.phoneNumberId, wabaId: credential.wabaId, accessToken: credential.accessToken },
        {
          name: data.name,
          category: data.category,
          language: data.language,
          components: data.components,
        }
      )

      // Salvar no banco
      const template = await WhatsappOfficialTemplate.create({
        tenantId: user.tenantId,
        metaTemplateId: metaResult.id,
        name: data.name,
        displayName: data.displayName || data.name,
        category: data.category,
        language: data.language,
        status: (metaResult.status as any) || 'PENDING',
        components: data.components,
        bodyText: bodyComponent?.text || null,
        headerType: (headerComponent?.format || (headerComponent?.type === 'HEADER' ? 'TEXT' : null)) as any,
        headerText: headerComponent?.text || null,
        footerText: footerComponent?.text || null,
        buttonsCount: buttonsComponent?.buttons?.length || 0,
      })

      return response.created({
        success: true,
        data: template,
        message: 'Template criado com sucesso! Aguardando aprovação da Meta.',
      })
    } catch (error: any) {
      const metaError = error.response?.data?.error
      return response.badRequest({
        success: false,
        error: {
          code: 'META_API_ERROR',
          message: metaError?.message || 'Erro ao criar template na Meta',
          details: metaError,
        },
      })
    }
  }

  /**
   * DELETE /api/whatsapp-official/templates/:id
   * Deleta um template (na Meta e no banco)
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const template = await WhatsappOfficialTemplate.query()
      .where('tenant_id', user.tenantId)
      .where('id', params.id)
      .firstOrFail()

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .where('is_active', true)
      .first()

    // Tentar deletar na Meta também
    if (credential && template.name) {
      try {
        await whatsappOfficialService.deleteTemplate(
          { phoneNumberId: credential.phoneNumberId, wabaId: credential.wabaId, accessToken: credential.accessToken },
          template.name
        )
      } catch (error: any) {
        // Se já foi deletado na Meta, apenas remove do banco
        console.warn('Warning: Could not delete template from Meta:', error.message)
      }
    }

    await template.delete()

    return response.ok({
      success: true,
      data: { message: 'Template removido com sucesso' },
    })
  }

  /**
   * POST /api/whatsapp-official/templates/sync
   * Sincroniza templates da Meta para o banco local
   */
  async sync({ auth, response }: HttpContext) {
    const user = auth.user!

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .where('is_active', true)
      .first()

    if (!credential) {
      return response.badRequest({
        success: false,
        error: {
          code: 'NO_CREDENTIALS',
          message: 'Configure as credenciais da API Oficial antes de sincronizar.',
        },
      })
    }

    try {
      const metaTemplates = await whatsappOfficialService.listTemplates(
        { phoneNumberId: credential.phoneNumberId, wabaId: credential.wabaId, accessToken: credential.accessToken },
        { limit: 100 }
      )

      let created = 0
      let updated = 0

      for (const metaTemplate of metaTemplates.data) {
        const bodyComponent = metaTemplate.components?.find((c: any) => c.type === 'BODY')
        const headerComponent = metaTemplate.components?.find((c: any) => c.type === 'HEADER')
        const footerComponent = metaTemplate.components?.find((c: any) => c.type === 'FOOTER')
        const buttonsComponent = metaTemplate.components?.find((c: any) => c.type === 'BUTTONS')

        const existing = await WhatsappOfficialTemplate.query()
          .where('tenant_id', user.tenantId)
          .where('meta_template_id', metaTemplate.id)
          .first()

        if (existing) {
          existing.status = metaTemplate.status
          existing.components = metaTemplate.components || []
          existing.bodyText = bodyComponent?.text || null
          existing.rejectionReason = metaTemplate.rejected_reason || null
          if (metaTemplate.status === 'APPROVED' && !existing.approvedAt) {
            existing.approvedAt = DateTime.now()
          }
          await existing.save()
          updated++
        } else {
          await WhatsappOfficialTemplate.create({
            tenantId: user.tenantId,
            metaTemplateId: metaTemplate.id,
            name: metaTemplate.name,
            displayName: metaTemplate.name,
            category: metaTemplate.category,
            language: metaTemplate.language,
            status: metaTemplate.status,
            components: metaTemplate.components || [],
            bodyText: bodyComponent?.text || null,
            headerType: (headerComponent?.format || null) as any,
            headerText: headerComponent?.text || null,
            footerText: footerComponent?.text || null,
            buttonsCount: buttonsComponent?.buttons?.length || 0,
            rejectionReason: metaTemplate.rejected_reason || null,
            approvedAt: metaTemplate.status === 'APPROVED' ? DateTime.now() : null,
          })
          created++
        }
      }

      return response.ok({
        success: true,
        data: {
          synced: metaTemplates.data.length,
          created,
          updated,
          message: `Sincronização concluída: ${created} criados, ${updated} atualizados`,
        },
      })
    } catch (error: any) {
      const metaError = error.response?.data?.error
      return response.badRequest({
        success: false,
        error: {
          code: 'META_API_ERROR',
          message: metaError?.message || 'Erro ao sincronizar templates da Meta',
          details: metaError,
        },
      })
    }
  }
}
