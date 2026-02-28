import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import Subscription from '#models/subscription'
import UnifiedMessageLog from '#models/unified_message_log'
import AbandonedCart from '#models/abandoned_cart'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Controller para painel administrativo geral do sistema
 * Fornece estatísticas e visão global de todos os tenants
 */
export default class AdminController {
  /**
   * GET /api/admin/dashboard
   * Dashboard principal com estatísticas gerais do sistema
   */
  async dashboard({ response }: HttpContext) {
    try {
      // Cards principais
      const totalTenants = await Tenant.query().count('* as total')
      const activeTenants = await Tenant.query().where('is_active', true).count('* as total')
      const trialTenants = await Subscription.query()
        .where('status', 'trial')
        .count('* as total')

      // Mensagens
      const totalMessages = await UnifiedMessageLog.query().count('* as total')
      const messagesSuccessful = await UnifiedMessageLog.query()
        .where('status', 'sent')
        .count('* as total')
      const messagesFailed = await UnifiedMessageLog.query()
        .where('status', 'failed')
        .count('* as total')

      const successRate =
        totalMessages[0].$extras.total > 0
          ? ((messagesSuccessful[0].$extras.total / totalMessages[0].$extras.total) * 100).toFixed(2)
          : 0

      // Mensagens hoje
      const today = DateTime.now().startOf('day')
      const messagesToday = await UnifiedMessageLog.query()
        .where('created_at', '>=', today.toSQL()!)
        .count('* as total')

      // Mensagens este mês
      const startOfMonth = DateTime.now().startOf('month')
      const messagesThisMonth = await UnifiedMessageLog.query()
        .where('created_at', '>=', startOfMonth.toSQL()!)
        .count('* as total')

      // Carrinhos
      const totalCarts = await AbandonedCart.query().count('* as total')
      const recoveredCarts = await AbandonedCart.query()
        .where('status', 'recovered')
        .count('* as total')

      // Crescimento de tenants (últimos 30 dias)
      const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQL()
      const tenantGrowth = await db
        .from('tenants')
        .select(db.raw('DATE(created_at) as date'))
        .count('* as count')
        .where('created_at', '>=', thirtyDaysAgo!)
        .groupByRaw('DATE(created_at)')
        .orderBy('date', 'asc')

      // Mensagens por dia (últimos 30 dias)
      const messagesByDay = await db.rawQuery(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM unified_message_logs
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [thirtyDaysAgo])

      // Distribuição por plano
      const planDistribution = await db
        .from('subscriptions')
        .select('plan_type')
        .count('* as count')
        .groupBy('plan_type')

      // Top 10 tenants mais ativos (por mensagens)
      const topTenants = await db
        .from('unified_message_logs')
        .select('tenants.id', 'tenants.name', 'tenants.email')
        .count('unified_message_logs.id as message_count')
        .join('tenants', 'unified_message_logs.tenant_id', 'tenants.id')
        .groupBy('tenants.id', 'tenants.name', 'tenants.email')
        .orderBy('message_count', 'desc')
        .limit(10)

      // Últimos cadastros
      const recentTenants = await Tenant.query()
        .select('id', 'name', 'email', 'is_active', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5)

      // Últimas mensagens com falha
      const recentFailures = await UnifiedMessageLog.query()
        .select(
          'id',
          'tenant_id',
          'customer_phone',
          'error_message',
          'provider',
          'created_at'
        )
        .where('status', 'failed')
        .preload('tenant', (query) => {
          query.select('id', 'name')
        })
        .orderBy('created_at', 'desc')
        .limit(10)

      return response.ok({
        cards: {
          tenants: {
            total: totalTenants[0].$extras.total,
            active: activeTenants[0].$extras.total,
            trial: trialTenants[0].$extras.total,
          },
          messages: {
            total: totalMessages[0].$extras.total,
            successful: messagesSuccessful[0].$extras.total,
            failed: messagesFailed[0].$extras.total,
            successRate: parseFloat(successRate as string),
            today: messagesToday[0].$extras.total,
            thisMonth: messagesThisMonth[0].$extras.total,
          },
          carts: {
            total: totalCarts[0].$extras.total,
            recovered: recoveredCarts[0].$extras.total,
          },
        },
        charts: {
          tenantGrowth,
          messagesByDay: messagesByDay.rows || messagesByDay[0] || [],
          planDistribution,
        },
        tables: {
          topTenants,
          recentTenants,
          recentFailures,
        },
      })
    } catch (error: any) {
      console.error('[Admin Dashboard] Erro ao buscar estatísticas:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch dashboard statistics',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/stats/overview
   * Estatísticas resumidas para cards do dashboard
   */
  async statsOverview({ response }: HttpContext) {
    try {
      const [tenants, messages, carts] = await Promise.all([
        // Tenants
        db.from('tenants').count('* as total').first(),

        // Mensagens
        db.from('unified_message_logs').select([
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed'),
        ]).first(),

        // Carrinhos
        db.from('abandoned_carts').count('* as total').first(),
      ])

      return response.ok({
        tenants: tenants?.total || 0,
        messages: {
          total: messages?.total || 0,
          sent: messages?.sent || 0,
          failed: messages?.failed || 0,
        },
        carts: carts?.total || 0,
      })
    } catch (error: any) {
      console.error('[Admin Stats] Erro:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch stats',
        details: error.message,
      })
    }
  }
}
