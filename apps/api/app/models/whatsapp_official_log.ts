import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import WhatsappOfficialTemplate from './whatsapp_official_template.js'

export default class WhatsappOfficialLog extends BaseModel {
  static table = 'whatsapp_official_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare officialTemplateId: number | null

  @column()
  declare abandonedCartId: number | null

  @column()
  declare templateName: string

  @column()
  declare recipientPhone: string

  @column()
  declare recipientName: string | null

  @column()
  declare languageCode: string

  @column()
  declare messageType: 'template' | 'text' | 'image' | 'document'

  @column()
  declare status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

  @column()
  declare metaMessageId: string | null

  @column()
  declare errorMessage: string | null

  @column()
  declare errorCode: number | null

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
  declare bodyParams: any | null

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
  declare headerParams: any | null

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
  declare buttonParams: any | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => WhatsappOfficialTemplate, { foreignKey: 'officialTemplateId' })
  declare template: BelongsTo<typeof WhatsappOfficialTemplate>
}
