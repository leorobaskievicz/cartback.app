import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare plan: 'trial' | 'starter' | 'pro' | 'business'

  @column()
  declare status: 'active' | 'past_due' | 'cancelled' | 'trial' | 'pending'

  @column()
  declare paymentGateway: 'asaas' | null

  @column()
  declare externalSubscriptionId: string | null

  @column()
  declare externalCustomerId: string | null

  @column.dateTime()
  declare currentPeriodStart: DateTime

  @column.dateTime()
  declare currentPeriodEnd: DateTime

  @column()
  declare messagesLimit: number

  @column()
  declare messagesUsed: number

  @column.dateTime()
  declare trialEndsAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  // Métodos auxiliares
  canSendMessage(): boolean {
    // Trial expirado
    if (this.status === 'trial' && this.trialEndsAt && DateTime.now() > this.trialEndsAt) {
      return false
    }

    // Subscription cancelada ou vencida
    if (['cancelled', 'past_due'].includes(this.status)) {
      return false
    }

    // Limite de mensagens atingido
    if (this.messagesUsed >= this.messagesLimit) {
      return false
    }

    return true
  }

  async incrementMessageCount(): Promise<void> {
    this.messagesUsed += 1
    await this.save()
  }

  getRemainingMessages(): number {
    return Math.max(0, this.messagesLimit - this.messagesUsed)
  }

  getUsagePercentage(): number {
    return Math.round((this.messagesUsed / this.messagesLimit) * 100)
  }

  isTrialExpired(): boolean {
    return this.status === 'trial' && this.trialEndsAt !== null && DateTime.now() > this.trialEndsAt
  }

  isPaid(): boolean {
    return this.plan !== 'trial' && this.status === 'active'
  }
}
