import { DateTime } from 'luxon'
import RateLimitConfig from '#models/rate_limit_config'
import WhatsappHealthMetric from '#models/whatsapp_health_metric'
import MessageLog from '#models/message_log'
import { Redis as IORedis } from 'ioredis'
import env from '#start/env'

// Instância compartilhada de Redis
const redis = new IORedis(env.get('REDIS_URL', 'redis://localhost:6379'), {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfter?: number // segundos
  currentCount?: number
  limit?: number
}

export default class RateLimiterService {
  /**
   * Verifica se uma mensagem pode ser enviada agora
   */
  async canSendMessage(
    tenantId: number,
    whatsappInstanceId: number
  ): Promise<RateLimitResult> {
    // 1. Verificar configuração de rate limit do tenant
    const config = await this.getRateLimitConfig(tenantId)

    // 2. Verificar métricas de saúde
    const metrics = await WhatsappHealthMetric.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .first()

    if (!metrics) {
      return { allowed: true }
    }

    // 3. Verificar se está dentro do horário permitido
    // ⚠️ TEMPORARIAMENTE DESABILITADO - Permitir envios 24/7
    /*
    if (!config.isWithinAllowedHours()) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [startHour, startMin] = config.allowedStartTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin

      const minutesUntilStart =
        startMinutes > currentTime ? startMinutes - currentTime : 1440 - currentTime + startMinutes

      return {
        allowed: false,
        reason: `Mensagens só podem ser enviadas entre ${config.allowedStartTime} e ${config.allowedEndTime}`,
        retryAfter: minutesUntilStart * 60,
      }
    }
    */

    // 4. Verificar se quality está muito baixa
    // ⚠️ TEMPORARIAMENTE DESABILITADO - Não bloquear por qualidade
    /*
    if (config.autoPauseOnLowQuality && metrics.qualityRating === 'flagged') {
      return {
        allowed: false,
        reason:
          'Envios pausados automaticamente devido à qualidade crítica. Aguarde melhoria do score.',
      }
    }
    */

    // 5. Verificar limite por minuto
    const maxPerMinute = config.getEffectiveMaxPerMinute(
      metrics.isWarmingUp ? 2 : 10 // Durante warm-up: máx 2/min, depois: 10/min
    )

    if (metrics.messagesSentLastMinute >= maxPerMinute) {
      return {
        allowed: false,
        reason: `Limite de ${maxPerMinute} mensagens por minuto atingido`,
        retryAfter: 60,
        currentCount: metrics.messagesSentLastMinute,
        limit: maxPerMinute,
      }
    }

    // 6. Verificar limite por hora
    const maxPerHour = config.getEffectiveMaxPerHour(
      metrics.isWarmingUp ? 20 : 200 // Durante warm-up: máx 20/h, depois: 200/h
    )

    if (metrics.messagesSentLastHour >= maxPerHour) {
      const minutesToNextHour = 60 - new Date().getMinutes()
      return {
        allowed: false,
        reason: `Limite de ${maxPerHour} mensagens por hora atingido`,
        retryAfter: minutesToNextHour * 60,
        currentCount: metrics.messagesSentLastHour,
        limit: maxPerHour,
      }
    }

    // 7. Verificar limite diário
    const maxPerDay = metrics.isWarmingUp
      ? config.warmupMaxDailyMessages
      : metrics.dailyLimit

    if (metrics.messagesSentLast24h >= maxPerDay) {
      const now = DateTime.now()
      const tomorrow = now.plus({ days: 1 }).startOf('day')
      const secondsUntilTomorrow = tomorrow.diff(now, 'seconds').seconds

      return {
        allowed: false,
        reason: `Limite diário de ${maxPerDay} mensagens atingido`,
        retryAfter: Math.round(secondsUntilTomorrow),
        currentCount: metrics.messagesSentLast24h,
        limit: maxPerDay,
      }
    }

    // 8. Verificar delay mínimo entre mensagens
    if (metrics.lastMessageSentAt) {
      const secondsSinceLastMessage = Math.abs(
        DateTime.now().diff(metrics.lastMessageSentAt, 'seconds').seconds
      )

      if (secondsSinceLastMessage < config.minDelayBetweenMessages) {
        const waitTime = config.minDelayBetweenMessages - secondsSinceLastMessage
        return {
          allowed: false,
          reason: `Aguarde ${Math.ceil(waitTime)}s entre mensagens`,
          retryAfter: Math.ceil(waitTime),
        }
      }
    }

    // 9. Verificar se está em warm-up e respeitando limites progressivos
    if (metrics.isWarmingUp) {
      const maxDailyForCurrentDay = this.getWarmupDailyLimit(
        metrics.daysSinceConnection,
        config.warmupDailyIncrease
      )

      if (metrics.messagesSentLast24h >= maxDailyForCurrentDay) {
        return {
          allowed: false,
          reason: `Número em aquecimento (dia ${metrics.daysSinceConnection}/21): limite de ${maxDailyForCurrentDay} msgs/dia`,
          retryAfter: 3600,
          currentCount: metrics.messagesSentLast24h,
          limit: maxDailyForCurrentDay,
        }
      }
    }

    // 10. Verificar taxa de falhas recentes
    const failureRate = metrics.getFailureRate()
    if (failureRate > 30) {
      return {
        allowed: false,
        reason: `Taxa de falha muito alta (${failureRate}%). Verifique conexão e números.`,
      }
    }

    // Tudo OK!
    return { allowed: true }
  }

  /**
   * Registra que uma mensagem está sendo enviada (para rate limiting)
   */
  async recordMessageSend(tenantId: number, whatsappInstanceId: number): Promise<void> {
    const key = `rate_limit:${tenantId}:${whatsappInstanceId}`

    // Incrementar contadores no Redis para controle em tempo real
    await redis.hincrby(key, 'count_minute', 1)
    await redis.hincrby(key, 'count_hour', 1)
    await redis.hincrby(key, 'count_day', 1)

    // Definir expiração
    await redis.expire(key, 86400) // 24 horas

    // Definir expiração dos contadores individuais
    const now = DateTime.now()
    const secondsUntilNextMinute = 60 - now.second
    const secondsUntilNextHour = (60 - now.minute) * 60 - now.second

    // Agendar reset dos contadores
    setTimeout(() => redis.hdel(key, 'count_minute'), secondsUntilNextMinute * 1000)
    setTimeout(() => redis.hdel(key, 'count_hour'), secondsUntilNextHour * 1000)
  }

  /**
   * Valida se o conteúdo da mensagem é adequado
   */
  async validateMessageContent(
    tenantId: number,
    content: string,
    templateId: number | null
  ): Promise<{ valid: boolean; reason?: string }> {
    const config = await this.getRateLimitConfig(tenantId)

    // 1. Verificar se template é obrigatório
    if (config.requireTemplate && !templateId) {
      return {
        valid: false,
        reason: 'Envios avulsos não são permitidos. Use um template.',
      }
    }

    // 2. Verificar se mensagem tem personalização
    if (config.enablePersonalizationCheck) {
      const hasVariables = /\{\{.*?\}\}/.test(content)
      const hasDynamicContent = content.length > 50 // Mensagens muito curtas provavelmente são genéricas

      if (!hasVariables && !hasDynamicContent) {
        return {
          valid: false,
          reason: 'Mensagem muito genérica. Use variáveis para personalizar.',
        }
      }
    }

    // 3. Verificar se mensagem não é idêntica a muitas outras recentes
    const recentIdentical = await MessageLog.query()
      .where('tenant_id', tenantId)
      .where('content', content)
      .where('created_at', '>=', DateTime.now().minus({ hours: 24 }).toSQL())
      .count('* as total')

    if (Number(recentIdentical[0].$extras.total) >= config.maxIdenticalMessages) {
      return {
        valid: false,
        reason: `Você já enviou essa mensagem idêntica ${config.maxIdenticalMessages}x nas últimas 24h. Personalize!`,
      }
    }

    return { valid: true }
  }

  /**
   * Calcula o limite diário progressivo durante warm-up
   */
  private getWarmupDailyLimit(daysSinceConnection: number, dailyIncrease: number): number {
    // Dias 1-2: muito conservador
    if (daysSinceConnection <= 2) return 10

    // Dias 3-7: aumento gradual
    if (daysSinceConnection <= 7) return 10 + (daysSinceConnection - 2) * 5 // 10, 15, 20, 25, 30, 35

    // Dias 8-14: aumento mais rápido
    if (daysSinceConnection <= 14) return 35 + (daysSinceConnection - 7) * dailyIncrease

    // Dias 15-21: aproximando do limite normal
    if (daysSinceConnection <= 21) return 100 + (daysSinceConnection - 14) * 20

    // Após 21 dias: usar limite do tier
    return 250
  }

  /**
   * Obtém configuração de rate limit do tenant (ou cria padrão)
   */
  private async getRateLimitConfig(tenantId: number): Promise<RateLimitConfig> {
    let config = await RateLimitConfig.query().where('tenant_id', tenantId).first()

    if (!config) {
      // Criar configuração padrão
      config = await RateLimitConfig.create({
        tenantId,
        maxMessagesPerMinute: null,
        maxMessagesPerHour: null,
        maxMessagesPerDay: null,
        minDelayBetweenMessages: 3,
        warmupDailyIncrease: 10,
        warmupMaxDailyMessages: 50,
        allowedStartTime: '08:00:00',
        allowedEndTime: '22:00:00',
        blockManualSends: true,
        requireTemplate: true,
        enablePersonalizationCheck: true,
        minResponseRate: 30,
        autoPauseOnLowQuality: true,
        maxIdenticalMessages: 3,
        maxFailuresBeforePause: 10,
      })
    }

    return config
  }
}
