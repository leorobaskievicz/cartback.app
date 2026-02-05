import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import AbandonedCart from './abandoned_cart.js'
import MessageTemplate from './message_template.js'
import WhatsappInstance from './whatsapp_instance.js'

export default class MessageLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare abandonedCartId: number

  @column()
  declare messageTemplateId: number

  @column()
  declare whatsappInstanceId: number

  @column()
  declare phoneNumber: string

  @column()
  declare content: string

  @column()
  declare status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled'

  @column()
  declare externalMessageId: string | null

  @column()
  declare errorMessage: string | null

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

  @belongsTo(() => AbandonedCart)
  declare abandonedCart: BelongsTo<typeof AbandonedCart>

  @belongsTo(() => MessageTemplate)
  declare messageTemplate: BelongsTo<typeof MessageTemplate>

  @belongsTo(() => WhatsappInstance)
  declare whatsappInstance: BelongsTo<typeof WhatsappInstance>
}
