import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import StoreIntegration from './store_integration.js'
import MessageLog from './message_log.js'

interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

export default class AbandonedCart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare storeIntegrationId: number

  @column()
  declare externalCartId: string

  @column()
  declare externalCustomerId: string | null

  @column()
  declare customerName: string | null

  @column()
  declare customerEmail: string | null

  @column()
  declare customerPhone: string

  @column()
  declare cartUrl: string | null

  @column()
  declare totalValue: number | null

  @column()
  declare currency: string

  @column({
    prepare: (value: CartItem[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (error) {
          console.error('Failed to parse items JSON:', value)
          return null
        }
      }
      return value as CartItem[]
    },
  })
  declare items: CartItem[] | null

  @column()
  declare status: 'pending' | 'processing' | 'recovered' | 'completed' | 'expired' | 'cancelled'

  @column.dateTime()
  declare recoveredAt: DateTime | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => StoreIntegration)
  declare storeIntegration: BelongsTo<typeof StoreIntegration>

  @hasMany(() => MessageLog)
  declare messageLogs: HasMany<typeof MessageLog>
}
