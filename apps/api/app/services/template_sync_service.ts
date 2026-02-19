import MessageTemplate from '#models/message_template'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import whatsappOfficialService from '#services/whatsapp_official_service'
import type { TemplateComponent } from '#models/whatsapp_official_template'
import { DateTime } from 'luxon'

interface TemplateVariable {
  placeholder: string // {{nome}}
  metaIndex: number // 1, 2, 3...
}

export class TemplateSyncService {
  /**
   * Extrai variáveis do conteúdo do template CartBack
   * Converte {{nome}}, {{produtos}}, {{link}}, {{total}} → {{1}}, {{2}}, {{3}}, {{4}}
   */
  private extractVariables(content: string): TemplateVariable[] {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
    const matches = [...content.matchAll(regex)]
    const uniqueVars = [...new Set(matches.map((m) => m[1]))]

    return uniqueVars.map((placeholder, index) => ({
      placeholder,
      metaIndex: index + 1,
    }))
  }

  /**
   * Converte template CartBack para formato Meta API
   */
  private convertToMetaFormat(template: MessageTemplate): {
    name: string
    components: TemplateComponent[]
    bodyText: string
  } {
    const variables = this.extractVariables(template.content)

    // Substituir {{nome}} → {{1}}, {{produtos}} → {{2}}, etc
    let metaBody = template.content
    variables.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v.placeholder}\\}\\}`, 'g')
      metaBody = metaBody.replace(regex, `{{${v.metaIndex}}}`)
    })

    // Gerar nome único pro template Meta (lowercase, sem espaços, sem caracteres especiais)
    const baseName = template.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 50)

    const uniqueName = `${baseName}_${Date.now()}`

    const components: TemplateComponent[] = [
      {
        type: 'BODY',
        text: metaBody,
        example: variables.length
          ? {
              body_text: [variables.map((v) => `exemplo_${v.placeholder}`)],
            }
          : undefined,
      },
    ]

    return {
      name: uniqueName,
      components,
      bodyText: metaBody,
    }
  }

  /**
   * Sincroniza um template CartBack → Meta
   * Cria template na Meta Cloud API
   */
  async syncTemplateToMeta(
    template: MessageTemplate,
    credential: WhatsappOfficialCredential
  ): Promise<void> {
    console.log(`🔄 Syncing template "${template.name}" (ID ${template.id}) to Meta`)

    // Se já tem metaTemplateId e está approved, não reenviar
    if (template.metaTemplateId && template.metaStatus === 'approved') {
      console.log(`✅ Template already approved on Meta, skipping`)
      return
    }

    const { name, components, bodyText } = this.convertToMetaFormat(template)

    try {
      const metaTemplate = await whatsappOfficialService.createTemplate(
        {
          phoneNumberId: credential.phoneNumberId,
          wabaId: credential.wabaId,
          accessToken: credential.accessToken,
        },
        {
          name,
          category: template.metaCategory || 'MARKETING',
          language: template.metaLanguage || 'pt_BR',
          components,
        }
      )

      // Atualizar template com info da Meta
      template.metaTemplateId = metaTemplate.id
      template.metaTemplateName = name
      template.metaStatus = metaTemplate.status.toLowerCase() as any
      template.metaComponents = components
      template.syncedAt = DateTime.now()
      await template.save()

      console.log(
        `✅ Template synced to Meta - ID: ${metaTemplate.id}, Status: ${metaTemplate.status}`
      )
    } catch (error: any) {
      console.error(`❌ Failed to sync template to Meta:`, error.message)

      // Atualizar com erro
      template.metaStatus = 'rejected'
      template.metaRejectionReason = error.response?.data?.error?.message || error.message
      template.syncedAt = DateTime.now()
      await template.save()

      throw error
    }
  }

  /**
   * Importa templates da Meta → CartBack
   * Busca templates APPROVED na Meta que ainda não existem no CartBack
   */
  async importTemplatesFromMeta(
    tenantId: number,
    credential: WhatsappOfficialCredential
  ): Promise<number> {
    console.log(`📥 Importing templates from Meta for tenant ${tenantId}`)

    try {
      const metaTemplates = await whatsappOfficialService.listTemplates({
        phoneNumberId: credential.phoneNumberId,
        wabaId: credential.wabaId,
        accessToken: credential.accessToken,
      })

      let imported = 0

      for (const metaTemplate of metaTemplates.data) {
        // Verificar se já existe no CartBack
        const existing = await MessageTemplate.query()
          .where('tenant_id', tenantId)
          .where('meta_template_id', metaTemplate.id)
          .first()

        if (existing) {
          // Atualizar status se mudou
          if (existing.metaStatus !== metaTemplate.status.toLowerCase()) {
            existing.metaStatus = metaTemplate.status.toLowerCase() as any
            existing.syncedAt = DateTime.now()
            if (metaTemplate.rejected_reason) {
              existing.metaRejectionReason = metaTemplate.rejected_reason
            }
            await existing.save()
          }
          continue
        }

        // Apenas importar templates APPROVED
        if (metaTemplate.status !== 'APPROVED') {
          continue
        }

        // Extrair texto do BODY component
        const bodyComponent = metaTemplate.components.find((c) => c.type === 'BODY')
        if (!bodyComponent?.text) {
          console.log(`⚠️ Template ${metaTemplate.name} has no BODY text, skipping`)
          continue
        }

        // Converter {{1}}, {{2}} de volta para {{nome}}, {{produtos}} (genérico)
        let cartbackContent = bodyComponent.text
        const variableMatches = [...bodyComponent.text.matchAll(/\{\{(\d+)\}\}/g)]
        const varCount = variableMatches.length

        const genericVars = ['nome', 'produtos', 'link', 'total', 'valor', 'data', 'codigo']
        variableMatches.forEach((match) => {
          const index = parseInt(match[1]) - 1
          const genericName = genericVars[index] || `var${index + 1}`
          cartbackContent = cartbackContent.replace(
            new RegExp(`\\{\\{${match[1]}\\}\\}`, 'g'),
            `{{${genericName}}}`
          )
        })

        // Pegar maior sort_order
        const maxSortOrder = await MessageTemplate.query()
          .where('tenant_id', tenantId)
          .max('sort_order as max')
          .firstOrFail()

        // Criar template no CartBack
        await MessageTemplate.create({
          tenantId,
          name: `${metaTemplate.name} (Meta)`,
          triggerType: 'abandoned_cart', // default
          delayMinutes: 60, // default
          content: cartbackContent,
          isActive: true,
          sortOrder: (maxSortOrder.$extras.max || 0) + 1,
          metaTemplateId: metaTemplate.id,
          metaTemplateName: metaTemplate.name,
          metaStatus: 'approved',
          metaLanguage: metaTemplate.language,
          metaCategory: metaTemplate.category,
          metaComponents: metaTemplate.components,
          syncedAt: DateTime.now(),
        })

        imported++
        console.log(`✅ Imported template: ${metaTemplate.name}`)
      }

      console.log(`📥 Imported ${imported} new templates from Meta`)
      return imported
    } catch (error: any) {
      console.error(`❌ Failed to import templates from Meta:`, error.message)
      throw error
    }
  }

  /**
   * Sincronização completa bidirecional
   * 1. Envia templates CartBack não sincronizados → Meta
   * 2. Importa templates Meta APPROVED → CartBack
   * 3. Atualiza status de templates existentes
   */
  async fullSync(tenantId: number): Promise<{
    sentToMeta: number
    importedFromMeta: number
    updated: number
  }> {
    console.log(`🔄 Starting full template sync for tenant ${tenantId}`)

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .first()

    if (!credential) {
      throw new Error('No active WhatsApp Official API credential found')
    }

    let sentToMeta = 0
    let updated = 0

    // 1. Enviar templates CartBack → Meta (apenas os que não foram sincronizados)
    const unsyncedTemplates = await MessageTemplate.query()
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .where((query) => {
        query.whereNull('meta_template_id').orWhere('meta_status', 'not_synced')
      })

    for (const template of unsyncedTemplates) {
      try {
        await this.syncTemplateToMeta(template, credential)
        sentToMeta++
      } catch (error) {
        console.error(`Failed to sync template ${template.id}:`, error)
      }
    }

    // 2. Importar templates Meta → CartBack
    const importedFromMeta = await this.importTemplatesFromMeta(tenantId, credential)

    // 3. Atualizar status de templates existentes
    const syncedTemplates = await MessageTemplate.query()
      .where('tenant_id', tenantId)
      .whereNotNull('meta_template_id')

    for (const template of syncedTemplates) {
      if (!template.metaTemplateId) continue

      try {
        const metaTemplate = await whatsappOfficialService.getTemplate(
          {
            phoneNumberId: credential.phoneNumberId,
            wabaId: credential.wabaId,
            accessToken: credential.accessToken,
          },
          template.metaTemplateId
        )

        const newStatus = metaTemplate.status.toLowerCase() as any
        if (template.metaStatus !== newStatus) {
          template.metaStatus = newStatus
          template.syncedAt = DateTime.now()
          if (metaTemplate.rejected_reason) {
            template.metaRejectionReason = metaTemplate.rejected_reason
          }
          await template.save()
          updated++
        }
      } catch (error) {
        console.error(`Failed to update template ${template.id} status:`, error)
      }
    }

    console.log(
      `✅ Sync complete - Sent: ${sentToMeta}, Imported: ${importedFromMeta}, Updated: ${updated}`
    )

    return { sentToMeta, importedFromMeta, updated }
  }
}

export default new TemplateSyncService()
