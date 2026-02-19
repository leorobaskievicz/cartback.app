import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import WhatsappOfficialLog from './whatsapp_official_log.js'

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'
export type TemplateHeaderType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  buttons?: TemplateButton[]
  example?: {
    header_text?: string[]
    body_text?: string[][]
    header_handle?: string[]
  }
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
  text: string
  url?: string
  phone_number?: string
}

export default class WhatsappOfficialTemplate extends BaseModel {
  static table = 'whatsapp_official_templates'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare metaTemplateId: string | null

  @column()
  declare name: string

  @column()
  declare displayName: string | null

  @column()
  declare category: TemplateCategory

  @column()
  declare language: string

  @column()
  declare status: TemplateStatus

  @column()
  declare rejectionReason: string | null

  @column({
    prepare: (value: TemplateComponent[]) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },
  })
  declare components: TemplateComponent[]

  @column()
  declare bodyText: string | null

  @column()
  declare headerType: TemplateHeaderType

  @column()
  declare headerText: string | null

  @column()
  declare footerText: string | null

  @column()
  declare buttonsCount: number

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => WhatsappOfficialLog)
  declare logs: HasMany<typeof WhatsappOfficialLog>
}
