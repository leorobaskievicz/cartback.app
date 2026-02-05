import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import MessageLog from './message_log.js'

export default class WhatsappInstance extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare instanceName: string

  @column()
  declare instanceId: string | null

  @column()
  declare phoneNumber: string | null

  @column()
  declare status: 'disconnected' | 'connecting' | 'connected'

  @column()
  declare qrCode: string | null

  @column.dateTime()
  declare connectedAt: DateTime | null

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
