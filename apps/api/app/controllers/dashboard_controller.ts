import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import AbandonedCart from '#models/abandoned_cart'
import MessageLog from '#models/message_log'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Métricas gerais do dashboard
   */
  async stats({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

    // Total de carrinhos abandonados
    const totalCarts = await AbandonedCart.query()
      .where('tenant_id', tenant.id)
      .count('* as total')

    // Carrinhos recuperados
    const recoveredCarts = await AbandonedCart.query()
      .where('tenant_id', tenant.id)
      .where('status', 'recovered')
      .count('* as total')

    // Taxa de recuperação
    const recoveryRate =
      totalCarts[0].$extras.total > 0
        ? (recoveredCarts[0].$extras.total / totalCarts[0].$extras.total) * 100
        : 0

    // Valor total recuperado
    const totalRecovered = await AbandonedCart.query()
      .where('tenant_id', tenant.id)
      .where('status', 'recovered')
      .sum('total_value as total')

    // Mensagens enviadas (últimos 30 dias)
    const messagesSent = await MessageLog.query()
      .where('tenant_id', tenant.id)
      .where('created_at', '>=', thirtyDaysAgo.toSQL())
      .whereIn('status', ['sent', 'delivered', 'read'])
      .count('* as total')

    // Carrinhos ativos (pendentes + processando)
    const activeCarts = await AbandonedCart.query()
      .where('tenant_id', tenant.id)
      .whereIn('status', ['pending', 'processing'])
      .count('* as total')

    return response.ok({
      success: true,
      data: {
        totalCarts: totalCarts[0].$extras.total,
        recoveredCarts: recoveredCarts[0].$extras.total,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        totalRecovered: totalRecovered[0].$extras.total || 0,
        messagesSent: messagesSent[0].$extras.total,
        activeCarts: activeCarts[0].$extras.total,
      },
    })
  }

  /**
   * GET /api/dashboard/chart
   * Dados para gráfico (últimos 30 dias)
   */
  async chart({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQLDate()

    // Carrinhos por dia (últimos 30 dias)
    const cartsByDay = await db
      .from('abandoned_carts')
      .select(db.raw('DATE(created_at) as date'))
      .count('* as total')
      .where('tenant_id', tenant.id)
      .where('created_at', '>=', thirtyDaysAgo)
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    // Recuperações por dia
    const recoveriesByDay = await db
      .from('abandoned_carts')
      .select(db.raw('DATE(recovered_at) as date'))
      .count('* as total')
      .sum('total_value as value')
      .where('tenant_id', tenant.id)
      .where('status', 'recovered')
      .whereNotNull('recovered_at')
      .where('recovered_at', '>=', thirtyDaysAgo)
      .groupByRaw('DATE(recovered_at)')
      .orderBy('date', 'asc')

    // Mensagens enviadas por dia
    const messagesByDay = await db
      .from('message_logs')
      .select(db.raw('DATE(sent_at) as date'))
      .count('* as total')
      .where('tenant_id', tenant.id)
      .whereNotNull('sent_at')
      .where('sent_at', '>=', thirtyDaysAgo)
      .groupByRaw('DATE(sent_at)')
      .orderBy('date', 'asc')

    // Combinar os dados em um único array por data
    const chartData: Record<
      string,
      { date: string; carts: number; recovered: number; messages: number }
    > = {}

    // Adicionar carrinhos
    cartsByDay.forEach((row: any) => {
      const date = row.date
      if (!chartData[date]) {
        chartData[date] = { date, carts: 0, recovered: 0, messages: 0 }
      }
      chartData[date].carts = Number(row.total)
    })

    // Adicionar recuperações
    recoveriesByDay.forEach((row: any) => {
      const date = row.date
      if (!chartData[date]) {
        chartData[date] = { date, carts: 0, recovered: 0, messages: 0 }
      }
      chartData[date].recovered = Number(row.total)
    })

    // Adicionar mensagens
    messagesByDay.forEach((row: any) => {
      const date = row.date
      if (!chartData[date]) {
        chartData[date] = { date, carts: 0, recovered: 0, messages: 0 }
      }
      chartData[date].messages = Number(row.total)
    })

    // Converter para array e ordenar por data
    const chartArray = Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date))

    return response.ok({
      success: true,
      data: chartArray,
    })
  }
}
