import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import User from './user.js'
import StoreIntegration from './store_integration.js'
import WhatsappInstance from './whatsapp_instance.js'
import MessageTemplate from './message_template.js'
import AbandonedCart from './abandoned_cart.js'
import MessageLog from './message_log.js'
import Subscription from './subscription.js'
import PaymentHistory from './payment_history.js'

export default class Tenant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ columnName: 'cpf_cnpj' })
  declare cpfCnpj: string | null

  @column()
  declare plan: 'trial' | 'starter' | 'pro' | 'business'

  @column.dateTime()
  declare trialEndsAt: DateTime | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => StoreIntegration)
  declare storeIntegrations: HasMany<typeof StoreIntegration>

  @hasMany(() => WhatsappInstance)
  declare whatsappInstances: HasMany<typeof WhatsappInstance>

  @hasMany(() => MessageTemplate)
  declare messageTemplates: HasMany<typeof MessageTemplate>

  @hasMany(() => AbandonedCart)
  declare abandonedCarts: HasMany<typeof AbandonedCart>

  @hasMany(() => MessageLog)
  declare messageLogs: HasMany<typeof MessageLog>

  @hasOne(() => Subscription)
  declare subscription: HasOne<typeof Subscription>

  @hasMany(() => PaymentHistory)
  declare paymentHistories: HasMany<typeof PaymentHistory>

  @beforeCreate()
  static async generateUuid(tenant: Tenant) {
    if (!tenant.uuid) {
      tenant.uuid = randomUUID()
    }
  }
}
