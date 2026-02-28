import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import Subscription from '#models/subscription'
import UnifiedMessageLog from '#models/unified_message_log'
import AbandonedCart from '#models/abandoned_cart'
import MessageTemplate from '#models/message_template'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import StoreIntegration from '#models/store_integration'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Controller para gerenciamento de tenants no painel admin
 */
export default class AdminTenantsController {
  /**
   * GET /api/admin/tenants
   * Lista todos os tenants com filtros e paginação
   */
  async index({ request, response }: HttpContext) {
    try {
      const { page = 1, limit = 20, search, status, plan } = request.qs()

      const query = Tenant.query()
        .select(
          'tenants.id',
          'tenants.uuid',
          'tenants.name',
          'tenants.email',
          'tenants.is_active',
          'tenants.created_at',
          'tenants.updated_at'
        )
        .preload('subscription', (query) => {
          query.select('tenant_id', 'plan_type', 'status', 'messages_limit', 'messages_used')
        })

      // Filtro de busca (nome ou email)
      if (search) {
        query.where((builder) => {
          builder.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`)
        })
      }

      // Filtro de status
      if (status === 'active') {
        query.where('is_active', true)
      } else if (status === 'inactive') {
        query.where('is_active', false)
      }

      // Filtro de plano
      if (plan) {
        query.whereHas('subscription', (subQuery) => {
          subQuery.where('plan_type', plan)
        })
      }

      // Ordenação padrão: mais recentes primeiro
      query.orderBy('created_at', 'desc')

      const tenants = await query.paginate(page, limit)

      // Adicionar estatísticas resumidas para cada tenant
      const tenantsWithStats = await Promise.all(
        tenants.all().map(async (tenant) => {
          const [messages, carts] = await Promise.all([
            UnifiedMessageLog.query().where('tenant_id', tenant.id).count('* as total').first(),
            AbandonedCart.query().where('tenant_id', tenant.id).count('* as total').first(),
          ])

          return {
            ...tenant.serialize(),
            stats: {
              totalMessages: messages?.$extras.total || 0,
              totalCarts: carts?.$extras.total || 0,
            },
          }
        })
      )

      return response.ok({
        data: tenantsWithStats,
        meta: tenants.getMeta(),
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao listar tenants:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch tenants',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/tenants/:id
   * Detalhes completos de um tenant específico
   */
  async show({ params, response }: HttpContext) {
    try {
      const tenant = await Tenant.query()
        .where('id', params.id)
        .preload('subscription')
        .firstOrFail()

      // Estatísticas do tenant
      const [messages, carts, templates, whatsappInstances, officialCredentials, integrations] =
        await Promise.all([
          // Mensagens
          db
            .from('unified_message_logs')
            .where('tenant_id', tenant.id)
            .select([
              db.raw('COUNT(*) as total'),
              db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
              db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed'),
              db.raw('SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as delivered'),
              db.raw('SUM(CASE WHEN status = "read" THEN 1 ELSE 0 END) as read'),
            ])
            .first(),

          // Carrinhos
          db
            .from('abandoned_carts')
            .where('tenant_id', tenant.id)
            .select([
              db.raw('COUNT(*) as total'),
              db.raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
              db.raw('SUM(CASE WHEN status = "recovered" THEN 1 ELSE 0 END) as recovered'),
            ])
            .first(),

          // Templates
          MessageTemplate.query().where('tenant_id', tenant.id).count('* as total').first(),

          // WhatsApp Instances
          WhatsappInstance.query().where('tenant_id', tenant.id).select('*'),

          // WhatsApp Official Credentials
          WhatsappOfficialCredential.query().where('tenant_id', tenant.id).select('*'),

          // Integrações
          StoreIntegration.query().where('tenant_id', tenant.id).select('*'),
        ])

      // Mensagens por dia (últimos 30 dias)
      const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQL()
      const messagesByDay = await db.rawQuery(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM unified_message_logs
        WHERE tenant_id = ? AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [tenant.id, thirtyDaysAgo])

      return response.ok({
        tenant: tenant.serialize(),
        stats: {
          messages: {
            total: messages?.total || 0,
            sent: messages?.sent || 0,
            failed: messages?.failed || 0,
            delivered: messages?.delivered || 0,
            read: messages?.read || 0,
          },
          carts: {
            total: carts?.total || 0,
            pending: carts?.pending || 0,
            recovered: carts?.recovered || 0,
          },
          templates: templates?.$extras.total || 0,
        },
        integrations: {
          whatsappInstances: whatsappInstances.map((i) => i.serialize()),
          officialCredentials: officialCredentials.map((c) => c.serialize()),
          stores: integrations.map((i) => i.serialize()),
        },
        charts: {
          messagesByDay: messagesByDay.rows || messagesByDay[0] || [],
        },
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao buscar tenant:', error.message)
      return response.notFound({
        error: 'Tenant not found',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/tenants/:id/logs
   * Logs de mensagens de um tenant específico (paginado)
   */
  async logs({ params, request, response }: HttpContext) {
    try {
      const { page = 1, limit = 50, status, provider, startDate, endDate } = request.qs()

      const query = UnifiedMessageLog.query()
        .where('tenant_id', params.id)
        .preload('abandonedCart', (q) => q.select('id', 'customer_name', 'customer_phone'))
        .preload('messageTemplate', (q) => q.select('id', 'name'))
        .orderBy('created_at', 'desc')

      // Filtros
      if (status) {
        query.where('status', status)
      }

      if (provider) {
        query.where('provider', provider)
      }

      if (startDate) {
        query.where('created_at', '>=', startDate)
      }

      if (endDate) {
        query.where('created_at', '<=', endDate)
      }

      const logs = await query.paginate(page, limit)

      return response.ok({
        data: logs.all().map((log) => log.serialize()),
        meta: logs.getMeta(),
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao buscar logs:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch logs',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/tenants/:id/templates
   * Templates de um tenant específico
   */
  async templates({ params, request, response }: HttpContext) {
    try {
      const { page = 1, limit = 20 } = request.qs()

      const templates = await MessageTemplate.query()
        .where('tenant_id', params.id)
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok({
        data: templates.all().map((t) => t.serialize()),
        meta: templates.getMeta(),
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao buscar templates:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch templates',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/tenants/:id/carts
   * Carrinhos abandonados de um tenant específico
   */
  async carts({ params, request, response }: HttpContext) {
    try {
      const { page = 1, limit = 20, status } = request.qs()

      const query = AbandonedCart.query()
        .where('tenant_id', params.id)
        .orderBy('created_at', 'desc')

      if (status) {
        query.where('status', status)
      }

      const carts = await query.paginate(page, limit)

      return response.ok({
        data: carts.all().map((c) => c.serialize()),
        meta: carts.getMeta(),
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao buscar carrinhos:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch carts',
        details: error.message,
      })
    }
  }

  /**
   * PATCH /api/admin/tenants/:id/toggle-status
   * Ativa/desativa um tenant
   */
  async toggleStatus({ params, response }: HttpContext) {
    try {
      const tenant = await Tenant.findOrFail(params.id)
      tenant.isActive = !tenant.isActive
      await tenant.save()

      console.log(
        `[Admin Tenants] Tenant ${tenant.id} (${tenant.name}) ${tenant.isActive ? 'ativado' : 'desativado'}`
      )

      return response.ok({
        message: `Tenant ${tenant.isActive ? 'activated' : 'deactivated'} successfully`,
        tenant: tenant.serialize(),
      })
    } catch (error: any) {
      console.error('[Admin Tenants] Erro ao alterar status:', error.message)
      return response.internalServerError({
        error: 'Failed to toggle tenant status',
        details: error.message,
      })
    }
  }
}
