import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import WhatsappOfficialLog from './whatsapp_official_log.js'

export default class WhatsappOfficialCredential extends BaseModel {
  static table = 'whatsapp_official_credentials'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare phoneNumberId: string

  @column()
  declare wabaId: string

  @column()
  declare accessToken: string

  @column()
  declare webhookVerifyToken: string

  @column()
  declare phoneNumber: string | null

  @column()
  declare displayName: string | null

  @column()
  declare status: 'active' | 'inactive' | 'error'

  @column()
  declare lastError: string | null

  @column()
  declare isActive: boolean

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
