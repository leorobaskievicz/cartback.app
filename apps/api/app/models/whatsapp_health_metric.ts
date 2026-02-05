import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'
import WhatsappInstance from './whatsapp_instance.js'

type QualityRating = 'high' | 'medium' | 'low' | 'flagged'
type CurrentTier = 'unverified' | 'tier1' | 'tier2' | 'tier3' | 'tier4'

export interface HealthAlert {
  type: 'rate_limit' | 'quality_low' | 'warmup_exceeded' | 'response_rate_low' | 'too_many_failures'
  severity: 'warning' | 'critical'
  message: string
  timestamp: string
}

export default class WhatsappHealthMetric extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare whatsappInstanceId: number

  @column()
  declare tenantId: number

  // Métricas de envio
  @column()
  declare messagesSentLastMinute: number

  @column()
  declare messagesSentLastHour: number

  @column({ columnName: 'messages_sent_last_24h' })
  declare messagesSentLast24h: number

  @column({ columnName: 'messages_sent_last_7days' })
  declare messagesSentLast7days: number

  // Métricas de qualidade
  @column()
  declare messagesDelivered: number

  @column()
  declare messagesRead: number

  @column()
  declare messagesFailed: number

  @column()
  declare userResponsesReceived: number

  @column()
  declare userBlocksReported: number

  // Health Score (0-100)
  @column()
  declare healthScore: number

  @column()
  declare qualityRating: QualityRating

  // Tier atual do WhatsApp
  @column()
  declare currentTier: CurrentTier

  @column()
  declare dailyLimit: number

  // Warm-up tracking
  @column.date()
  declare numberConnectedAt: DateTime | null

  @column()
  declare daysSinceConnection: number

  @column()
  declare isWarmingUp: boolean

  // Alertas
  @column()
  declare hasAlerts: boolean

  @column({
    prepare: (value: HealthAlert[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (error) {
          console.error('Failed to parse alerts JSON:', value)
          return null
        }
      }
      return value as HealthAlert[]
    },
  })
  declare alerts: HealthAlert[] | null

  // Últimas atualizações
  @column.dateTime()
  declare lastMessageSentAt: DateTime | null

  @column.dateTime()
  declare metricsCalculatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => WhatsappInstance)
  declare whatsappInstance: BelongsTo<typeof WhatsappInstance>

  // Métodos auxiliares
  public getResponseRate(): number {
    const totalSent = this.messagesSentLast7days
    if (totalSent === 0) return 0
    return Math.round((this.userResponsesReceived / totalSent) * 100)
  }

  public getDeliveryRate(): number {
    const totalSent = this.messagesSentLast7days
    if (totalSent === 0) return 100
    return Math.round((this.messagesDelivered / totalSent) * 100)
  }

  public getFailureRate(): number {
    const totalSent = this.messagesSentLast7days
    if (totalSent === 0) return 0
    return Math.round((this.messagesFailed / totalSent) * 100)
  }

  public isNearDailyLimit(): boolean {
    return this.messagesSentLast24h >= this.dailyLimit * 0.8 // 80% do limite
  }

  public isHealthy(): boolean {
    return this.healthScore >= 70 && this.qualityRating !== 'flagged'
  }
}
