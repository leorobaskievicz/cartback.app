import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import MessageLog from './message_log.js'

export default class MessageTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare name: string

  @column()
  declare triggerType: 'abandoned_cart' | 'tracking_update'

  @column()
  declare delayMinutes: number

  @column()
  declare content: string

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  // Meta WhatsApp Official API fields
  @column()
  declare metaTemplateId: string | null

  @column()
  declare metaTemplateName: string | null

  @column()
  declare metaStatus: 'pending' | 'approved' | 'rejected' | 'not_synced'

  @column()
  declare metaLanguage: string

  @column()
  declare metaCategory: 'MARKETING' | 'UTILITY'

  @column({
    prepare: (value: any) => {
      if (!value) return null
      // Se já é string, retorna como está
      if (typeof value === 'string') return value
      // Se é objeto, stringifica
      return JSON.stringify(value)
    },
    consume: (value: string | null) => {
      if (!value) return null
      // Se já é objeto (improvável mas previne erro)
      if (typeof value === 'object') return value
      // Se é string, faz parse
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error('Failed to parse metaComponents JSON:', value, error)
        return null
      }
    },
  })
  declare metaComponents: any | null

  @column()
  declare metaRejectionReason: string | null

  @column.dateTime()
  declare syncedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => MessageLog)
  declare messageLogs: HasMany<typeof MessageLog>
}
