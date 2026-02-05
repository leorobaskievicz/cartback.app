import { DateTime } from 'luxon'
import WhatsappHealthMetric, { type HealthAlert } from '#models/whatsapp_health_metric'
import MessageLog from '#models/message_log'
import WhatsappInstance from '#models/whatsapp_instance'
import db from '@adonisjs/lucid/services/db'

export default class WhatsappHealthService {
  /**
   * Calcula e atualiza as métricas de saúde de uma instância WhatsApp
   */
  async calculateAndUpdateMetrics(whatsappInstanceId: number): Promise<WhatsappHealthMetric> {
    const instance = await WhatsappInstance.findOrFail(whatsappInstanceId)

    // Buscar ou criar registro de métricas
    let metrics = await WhatsappHealthMetric.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .first()

    if (!metrics) {
      metrics = await WhatsappHealthMetric.create({
        whatsappInstanceId: instance.id,
        tenantId: instance.tenantId,
        healthScore: 100,
        qualityRating: 'high',
        currentTier: 'unverified',
        dailyLimit: 250,
        daysSinceConnection: 0,
        isWarmingUp: true,
        hasAlerts: false,
        messagesSentLastMinute: 0,
        messagesSentLastHour: 0,
        messagesSentLast24h: 0,
        messagesSentLast7days: 0,
        messagesDelivered: 0,
        messagesRead: 0,
        messagesFailed: 0,
        userResponsesReceived: 0,
        userBlocksReported: 0,
      })
    }

    // Atualizar contadores de envio
    await this.updateSendingMetrics(metrics, whatsappInstanceId)

    // Atualizar métricas de qualidade
    await this.updateQualityMetrics(metrics, whatsappInstanceId)

    // Calcular dias desde conexão
    if (instance.connectedAt) {
      const daysSince = Math.floor(DateTime.now().diff(instance.connectedAt, 'days').days)
      metrics.daysSinceConnection = daysSince
      metrics.numberConnectedAt = instance.connectedAt
      metrics.isWarmingUp = daysSince < 21 // 3 semanas de warm-up
    }

    // Calcular Health Score
    metrics.healthScore = this.calculateHealthScore(metrics)

    // Calcular Quality Rating
    metrics.qualityRating = this.calculateQualityRating(metrics)

    // Gerar alertas
    const alerts = this.generateAlerts(metrics)
    metrics.alerts = alerts.length > 0 ? alerts : null
    metrics.hasAlerts = alerts.length > 0

    // Atualizar timestamp
    metrics.metricsCalculatedAt = DateTime.now()

    await metrics.save()

    return metrics
  }

  /**
   * Atualiza métricas de envio (último minuto, hora, dia, semana)
   */
  private async updateSendingMetrics(
    metrics: WhatsappHealthMetric,
    whatsappInstanceId: number
  ): Promise<void> {
    const now = DateTime.now()

    // Último minuto
    const lastMinute = await MessageLog.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .where('created_at', '>=', now.minus({ minutes: 1 }).toSQL())
      .count('* as total')

    metrics.messagesSentLastMinute = Number(lastMinute[0].$extras.total)

    // Última hora
    const lastHour = await MessageLog.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .where('created_at', '>=', now.minus({ hours: 1 }).toSQL())
      .count('* as total')

    metrics.messagesSentLastHour = Number(lastHour[0].$extras.total)

    // Últimas 24 horas
    const last24h = await MessageLog.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .where('created_at', '>=', now.minus({ hours: 24 }).toSQL())
      .count('* as total')

    metrics.messagesSentLast24h = Number(last24h[0].$extras.total)

    // Últimos 7 dias
    const last7days = await MessageLog.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .where('created_at', '>=', now.minus({ days: 7 }).toSQL())
      .count('* as total')

    metrics.messagesSentLast7days = Number(last7days[0].$extras.total)

    // Última mensagem enviada
    const lastMessage = await MessageLog.query()
      .where('whatsapp_instance_id', whatsappInstanceId)
      .whereNotNull('sent_at')
      .orderBy('sent_at', 'desc')
      .first()

    if (lastMessage?.sentAt) {
      metrics.lastMessageSentAt = lastMessage.sentAt
    }
  }

  /**
   * Atualiza métricas de qualidade (entregas, leituras, falhas)
   */
  private async updateQualityMetrics(
    metrics: WhatsappHealthMetric,
    whatsappInstanceId: number
  ): Promise<void> {
    const now = DateTime.now()
    const since = now.minus({ days: 7 }).toSQL()

    // Contar mensagens por status nos últimos 7 dias
    const statusCounts = await db
      .from('message_logs')
      .where('whatsapp_instance_id', whatsappInstanceId)
      .where('created_at', '>=', since)
      .select('status')
      .count('* as total')
      .groupBy('status')

    const counts = statusCounts.reduce(
      (acc, row) => {
        acc[row.status] = Number(row.total)
        return acc
      },
      {} as Record<string, number>
    )

    metrics.messagesDelivered = (counts.delivered || 0) + (counts.read || 0)
    metrics.messagesRead = counts.read || 0
    metrics.messagesFailed = counts.failed || 0

    // TODO: Implementar tracking de respostas de usuários quando webhook estiver configurado
    // Por enquanto, vamos estimar baseado em mensagens lidas
    // Assumindo que 40% das mensagens lidas resultam em resposta (estimativa conservadora)
    metrics.userResponsesReceived = Math.floor(metrics.messagesRead * 0.4)

    // Bloqueios reportados - seria obtido do webhook do WhatsApp
    // Por enquanto mantém o valor atual
  }

  /**
   * Calcula o Health Score (0-100) baseado em múltiplos fatores
   */
  private calculateHealthScore(metrics: WhatsappHealthMetric): number {
    let score = 100

    // Fator 1: Taxa de entrega (peso 25%)
    const deliveryRate = metrics.getDeliveryRate()
    if (deliveryRate < 95) score -= (95 - deliveryRate) * 0.5
    if (deliveryRate < 85) score -= 10
    if (deliveryRate < 70) score -= 15

    // Fator 2: Taxa de falha (peso 25%)
    const failureRate = metrics.getFailureRate()
    if (failureRate > 5) score -= (failureRate - 5) * 2
    if (failureRate > 10) score -= 15
    if (failureRate > 20) score -= 25

    // Fator 3: Taxa de resposta (peso 30%)
    const responseRate = metrics.getResponseRate()
    if (responseRate < 30) score -= (30 - responseRate) * 0.8
    if (responseRate < 20) score -= 15
    if (responseRate < 10) score -= 20

    // Fator 4: Bloqueios reportados (peso 20%)
    if (metrics.userBlocksReported > 0) {
      const blockRate = (metrics.userBlocksReported / metrics.messagesSentLast7days) * 100
      if (blockRate > 0.5) score -= 20
      if (blockRate > 1) score -= 30
      if (blockRate > 2) score -= 40
    }

    // Fator 5: Proximidade do limite diário
    if (metrics.isNearDailyLimit()) {
      score -= 5 // Pequena penalidade se estiver perto do limite
    }

    // Fator 6: Período de warm-up
    if (metrics.isWarmingUp && metrics.messagesSentLast24h > 50) {
      score -= 10 // Enviando muito rápido durante warm-up
    }

    // Garantir que o score está entre 0 e 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Calcula o Quality Rating baseado no Health Score
   */
  private calculateQualityRating(
    metrics: WhatsappHealthMetric
  ): 'high' | 'medium' | 'low' | 'flagged' {
    const score = metrics.healthScore

    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'low'
    return 'flagged'
  }

  /**
   * Gera alertas baseados nas métricas atuais
   */
  private generateAlerts(metrics: WhatsappHealthMetric): HealthAlert[] {
    const alerts: HealthAlert[] = []
    const now = DateTime.now().toISO()!

    // Alerta: Próximo do limite diário
    if (metrics.isNearDailyLimit()) {
      alerts.push({
        type: 'rate_limit',
        severity: metrics.messagesSentLast24h >= metrics.dailyLimit * 0.95 ? 'critical' : 'warning',
        message: `Você já enviou ${metrics.messagesSentLast24h} de ${metrics.dailyLimit} mensagens permitidas hoje (${Math.round((metrics.messagesSentLast24h / metrics.dailyLimit) * 100)}%)`,
        timestamp: now,
      })
    }

    // Alerta: Quality rating baixo
    if (metrics.qualityRating === 'low' || metrics.qualityRating === 'flagged') {
      alerts.push({
        type: 'quality_low',
        severity: metrics.qualityRating === 'flagged' ? 'critical' : 'warning',
        message: `Qualidade ${metrics.qualityRating === 'flagged' ? 'CRÍTICA' : 'baixa'}: Score ${metrics.healthScore}/100. Reduza envios e melhore personalização.`,
        timestamp: now,
      })
    }

    // Alerta: Excedendo limites durante warm-up
    if (metrics.isWarmingUp && metrics.messagesSentLast24h > 50) {
      alerts.push({
        type: 'warmup_exceeded',
        severity: 'warning',
        message: `Número em warm-up (dia ${metrics.daysSinceConnection}/21): enviando ${metrics.messagesSentLast24h} msgs/dia. Recomendado: máx 50/dia.`,
        timestamp: now,
      })
    }

    // Alerta: Taxa de resposta baixa
    const responseRate = metrics.getResponseRate()
    if (responseRate < 30 && metrics.messagesSentLast7days > 20) {
      alerts.push({
        type: 'response_rate_low',
        severity: responseRate < 20 ? 'critical' : 'warning',
        message: `Taxa de resposta baixa: ${responseRate}%. Mínimo recomendado: 30%. Revise seus templates.`,
        timestamp: now,
      })
    }

    // Alerta: Muitas falhas
    const failureRate = metrics.getFailureRate()
    if (failureRate > 10 && metrics.messagesSentLast7days > 10) {
      alerts.push({
        type: 'too_many_failures',
        severity: failureRate > 20 ? 'critical' : 'warning',
        message: `Taxa de falha alta: ${failureRate}%. Verifique números de telefone e conexão.`,
        timestamp: now,
      })
    }

    return alerts
  }

  /**
   * Atualiza o tier e limite diário baseado no volume e qualidade
   */
  async updateTierIfNeeded(metrics: WhatsappHealthMetric): Promise<void> {
    // Verificar se está qualificado para upgrade de tier
    // Baseado nas regras do WhatsApp Business API

    const volumeLast7days = metrics.messagesSentLast7days
    const currentLimit = metrics.dailyLimit
    const usagePercent = (metrics.messagesSentLast24h / currentLimit) * 100

    // Regra: Precisa usar 50% do limite atual e ter qualidade alta
    if (metrics.qualityRating === 'high' && usagePercent >= 50) {
      let newTier = metrics.currentTier
      let newLimit = metrics.dailyLimit

      if (metrics.currentTier === 'unverified' && volumeLast7days >= 150) {
        newTier = 'tier1'
        newLimit = 1000
      } else if (metrics.currentTier === 'tier1' && volumeLast7days >= 700) {
        newTier = 'tier2'
        newLimit = 10000
      } else if (metrics.currentTier === 'tier2' && volumeLast7days >= 7000) {
        newTier = 'tier3'
        newLimit = 100000
      } else if (metrics.currentTier === 'tier3' && volumeLast7days >= 70000) {
        newTier = 'tier4'
        newLimit = 999999
      }

      if (newTier !== metrics.currentTier) {
        metrics.currentTier = newTier
        metrics.dailyLimit = newLimit
        await metrics.save()
      }
    }

    // Downgrade se qualidade baixar
    if (metrics.qualityRating === 'low' || metrics.qualityRating === 'flagged') {
      if (metrics.currentTier !== 'unverified') {
        const tiers = ['unverified', 'tier1', 'tier2', 'tier3', 'tier4']
        const currentIndex = tiers.indexOf(metrics.currentTier)
        if (currentIndex > 0) {
          const newTier = tiers[currentIndex - 1] as typeof metrics.currentTier
          const limits = {
            unverified: 250,
            tier1: 1000,
            tier2: 10000,
            tier3: 100000,
            tier4: 999999,
          }
          metrics.currentTier = newTier
          metrics.dailyLimit = limits[newTier]
          await metrics.save()
        }
      }
    }
  }
}
