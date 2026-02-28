import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import AbandonedCart from './abandoned_cart.js'
import MessageTemplate from './message_template.js'
import WhatsappInstance from './whatsapp_instance.js'
import WhatsappOfficialCredential from './whatsapp_official_credential.js'

/**
 * Modelo unificado de log de mensagens
 *
 * Registra TODOS os envios de mensagem da plataforma:
 * - Evolution API (WhatsApp Baileys)
 * - WhatsApp Official API (Meta)
 * - Envios individuais e em lote
 * - Sucessos e falhas
 *
 * Permite análise completa de todos os disparos e tentativas
 */
export default class UnifiedMessageLog extends BaseModel {
  static table = 'unified_message_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare provider: 'evolution' | 'official'

  @column()
  declare messageType: 'text' | 'template' | 'image' | 'document' | 'video' | 'audio'

  @column()
  declare customerPhone: string

  @column()
  declare customerName: string | null

  @column()
  declare abandonedCartId: number | null

  @column()
  declare messageTemplateId: number | null

  @column()
  declare templateName: string | null

  @column()
  declare whatsappInstanceId: number | null

  @column()
  declare officialCredentialId: number | null

  @column()
  declare messageContent: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare templateVariables: Record<string, any> | null

  @column()
  declare status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled'

  @column()
  declare externalMessageId: string | null

  @column()
  declare errorMessage: string | null

  @column()
  declare errorCode: string | null

  @column.dateTime()
  declare queuedAt: DateTime | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime()
  declare failedAt: DateTime | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => AbandonedCart)
  declare abandonedCart: BelongsTo<typeof AbandonedCart>

  @belongsTo(() => MessageTemplate)
  declare messageTemplate: BelongsTo<typeof MessageTemplate>

  @belongsTo(() => WhatsappInstance)
  declare whatsappInstance: BelongsTo<typeof WhatsappInstance>

  @belongsTo(() => WhatsappOfficialCredential)
  declare officialCredential: BelongsTo<typeof WhatsappOfficialCredential>

  /**
   * Método helper para criar log de envio via Evolution
   */
  static async logEvolutionSend(data: {
    tenantId: number
    customerPhone: string
    customerName?: string
    abandonedCartId?: number
    messageTemplateId?: number
    templateName?: string
    whatsappInstanceId?: number
    messageContent: string
    templateVariables?: Record<string, any>
    metadata?: Record<string, any>
  }): Promise<UnifiedMessageLog> {
    return await this.create({
      tenantId: data.tenantId,
      provider: 'evolution',
      messageType: 'text',
      customerPhone: data.customerPhone,
      customerName: data.customerName || null,
      abandonedCartId: data.abandonedCartId || null,
      messageTemplateId: data.messageTemplateId || null,
      templateName: data.templateName || null,
      whatsappInstanceId: data.whatsappInstanceId || null,
      messageContent: data.messageContent,
      templateVariables: data.templateVariables || null,
      status: 'queued',
      queuedAt: DateTime.now(),
      metadata: data.metadata || null,
    })
  }

  /**
   * Método helper para criar log de envio via WhatsApp Oficial
   */
  static async logOfficialSend(data: {
    tenantId: number
    customerPhone: string
    customerName?: string
    abandonedCartId?: number
    messageTemplateId?: number
    templateName?: string
    officialCredentialId?: number
    messageType?: 'text' | 'template' | 'image'
    messageContent?: string
    templateVariables?: Record<string, any>
    metadata?: Record<string, any>
  }): Promise<UnifiedMessageLog> {
    return await this.create({
      tenantId: data.tenantId,
      provider: 'official',
      messageType: data.messageType || 'template',
      customerPhone: data.customerPhone,
      customerName: data.customerName || null,
      abandonedCartId: data.abandonedCartId || null,
      messageTemplateId: data.messageTemplateId || null,
      templateName: data.templateName || null,
      officialCredentialId: data.officialCredentialId || null,
      messageContent: data.messageContent || null,
      templateVariables: data.templateVariables || null,
      status: 'queued',
      queuedAt: DateTime.now(),
      metadata: data.metadata || null,
    })
  }

  /**
   * Marca mensagem como enviada com sucesso
   */
  async markAsSent(externalMessageId?: string): Promise<void> {
    this.status = 'sent'
    this.sentAt = DateTime.now()
    if (externalMessageId) {
      this.externalMessageId = externalMessageId
    }
    await this.save()
  }

  /**
   * Marca mensagem como falha
   */
  async markAsFailed(errorMessage: string, errorCode?: string): Promise<void> {
    this.status = 'failed'
    this.failedAt = DateTime.now()
    this.errorMessage = errorMessage
    if (errorCode) {
      this.errorCode = errorCode
    }
    await this.save()
  }

  /**
   * Marca mensagem como entregue
   */
  async markAsDelivered(): Promise<void> {
    this.status = 'delivered'
    this.deliveredAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(): Promise<void> {
    this.status = 'read'
    this.readAt = DateTime.now()
    await this.save()
  }
}
