import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import Subscription from './subscription.js'

export default class PaymentHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare subscriptionId: number

  @column()
  declare targetPlan: string | null

  @column()
  declare externalPaymentId: string

  @column()
  declare amount: number // centavos

  @column()
  declare status: 'pending' | 'confirmed' | 'received' | 'overdue' | 'refunded' | 'cancelled'

  @column()
  declare paymentMethod: 'pix' | 'credit_card' | 'boleto'

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare dueDate: DateTime

  @column()
  declare invoiceUrl: string | null

  @column()
  declare pixQrCode: string | null

  @column()
  declare pixCopyPaste: string | null

  @column()
  declare boletoUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>
}
