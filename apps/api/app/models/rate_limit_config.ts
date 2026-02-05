import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from './tenant.js'

export default class RateLimitConfig extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  // Limites personalizados (null = usar padrão do sistema)
  @column()
  declare maxMessagesPerMinute: number | null

  @column()
  declare maxMessagesPerHour: number | null

  @column()
  declare maxMessagesPerDay: number | null

  // Delay entre mensagens (em segundos)
  @column()
  declare minDelayBetweenMessages: number

  // Warm-up settings
  @column()
  declare warmupDailyIncrease: number

  @column()
  declare warmupMaxDailyMessages: number

  // Horários permitidos
  @column()
  declare allowedStartTime: string

  @column()
  declare allowedEndTime: string

  // Proteções
  @column()
  declare blockManualSends: boolean

  @column()
  declare requireTemplate: boolean

  @column()
  declare enablePersonalizationCheck: boolean

  // Response rate mínima (%)
  @column()
  declare minResponseRate: number

  // Configurações avançadas
  @column()
  declare autoPauseOnLowQuality: boolean

  @column()
  declare maxIdenticalMessages: number

  @column()
  declare maxFailuresBeforePause: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  // Métodos auxiliares
  public getEffectiveMaxPerMinute(defaultValue: number): number {
    return this.maxMessagesPerMinute ?? defaultValue
  }

  public getEffectiveMaxPerHour(defaultValue: number): number {
    return this.maxMessagesPerHour ?? defaultValue
  }

  public getEffectiveMaxPerDay(tier: string): number {
    if (this.maxMessagesPerDay) return this.maxMessagesPerDay

    // Limites padrão por tier
    const limits = {
      unverified: 250,
      tier1: 1000,
      tier2: 10000,
      tier3: 100000,
      tier4: 999999,
    }
    return limits[tier as keyof typeof limits] || 250
  }

  public isWithinAllowedHours(): boolean {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
    return currentTime >= this.allowedStartTime && currentTime <= this.allowedEndTime
  }
}
