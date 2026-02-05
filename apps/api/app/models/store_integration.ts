import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import AbandonedCart from './abandoned_cart.js'

export default class StoreIntegration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare platform: 'nuvemshop' | 'yampi' | 'shopify' | 'woocommerce' | 'webhook'

  @column()
  declare storeId: string | null

  @column()
  declare storeName: string | null

  @column()
  declare storeUrl: string | null

  @column()
  declare accessToken: string | null

  @column()
  declare refreshToken: string | null

  @column()
  declare webhookSecret: string | null

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare connectedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => AbandonedCart)
  declare abandonedCarts: HasMany<typeof AbandonedCart>
}
