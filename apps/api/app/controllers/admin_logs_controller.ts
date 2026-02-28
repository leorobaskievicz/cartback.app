import type { HttpContext } from '@adonisjs/core/http'
import UnifiedMessageLog from '#models/unified_message_log'
import db from '@adonisjs/lucid/services/db'

/**
 * Controller para gerenciar logs de mensagens (Admin)
 */
export default class AdminLogsController {
  /**
   * GET /api/admin/logs
   * Lista todos os logs de mensagens do sistema
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 50)
      const tenantId = request.input('tenant_id')
      const status = request.input('status')
      const provider = request.input('provider')
      const search = request.input('search') // Busca por telefone ou nome

      const query = UnifiedMessageLog.query()
        .preload('tenant', (tenantQuery) => {
          tenantQuery.select('id', 'name', 'email')
        })
        .select(
          'id',
          'tenant_id',
          'provider',
          'customer_phone',
          'customer_name',
          'status',
          'message_content',
          'error_message',
          'error_code',
          'external_message_id',
          'created_at',
          'sent_at'
        )

      // Filtro por tenant
      if (tenantId) {
        query.where('tenant_id', tenantId)
      }

      // Filtro por status
      if (status) {
        query.where('status', status)
      }

      // Filtro por provider (evolution/official)
      if (provider) {
        query.where('provider', provider)
      }

      // Busca por telefone ou nome
      if (search) {
        query.where((builder) => {
          builder
            .where('customer_phone', 'like', `%${search}%`)
            .orWhere('customer_name', 'like', `%${search}%`)
        })
      }

      // Ordenação: mais recentes primeiro
      query.orderBy('created_at', 'desc')

      const logs = await query.paginate(page, perPage)

      return response.ok({
        success: true,
        data: logs.all(),
        meta: logs.getMeta(),
      })
    } catch (error: any) {
      console.error('[Admin Logs] Erro ao listar logs:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch logs',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/logs/stats
   * Estatísticas gerais dos logs
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await db.rawQuery(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN provider = 'evolution' THEN 1 ELSE 0 END) as evolution,
          SUM(CASE WHEN provider = 'official' THEN 1 ELSE 0 END) as official
        FROM unified_message_logs
      `)

      const topErrors = await db
        .from('unified_message_logs')
        .select('error_message', 'error_code')
        .count('* as count')
        .whereNotNull('error_message')
        .groupBy('error_message', 'error_code')
        .orderBy('count', 'desc')
        .limit(10)

      return response.ok({
        success: true,
        data: {
          overview: stats[0]?.[0] || {},
          topErrors,
        },
      })
    } catch (error: any) {
      console.error('[Admin Logs] Erro ao buscar estatísticas:', error.message)
      return response.internalServerError({
        error: 'Failed to fetch log statistics',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/logs/:id
   * Detalhes de um log específico
   */
  async show({ params, response }: HttpContext) {
    try {
      const log = await UnifiedMessageLog.query()
        .where('id', params.id)
        .preload('tenant')
        .preload('abandonedCart')
        .preload('messageTemplate')
        .preload('whatsappInstance')
        .preload('officialCredential')
        .firstOrFail()

      return response.ok({
        success: true,
        data: log,
      })
    } catch (error: any) {
      console.error('[Admin Logs] Erro ao buscar log:', error.message)
      return response.notFound({
        error: 'Log not found',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/admin/logs/analyze-failures
   * Analisa falhas comparando números que falharam vs que tiveram sucesso
   */
  async analyzeFailures({ request, response }: HttpContext) {
    try {
      const tenantId = request.input('tenant_id')

      // Pegar últimos 100 envios (sucesso e falha) para comparação
      const recentLogs = await db.rawQuery(`
        SELECT
          customer_phone,
          status,
          error_message,
          error_code,
          message_content,
          LENGTH(customer_phone) as phone_length,
          SUBSTRING(customer_phone, 1, 2) as country_code,
          created_at
        FROM unified_message_logs
        WHERE provider = 'evolution'
          ${tenantId ? 'AND tenant_id = ?' : ''}
        ORDER BY created_at DESC
        LIMIT 100
      `, tenantId ? [tenantId] : [])

      const logs = recentLogs[0]

      // Separar sucessos e falhas
      const successes = logs.filter((l: any) => l.status === 'sent')
      const failures = logs.filter((l: any) => l.status === 'failed')

      // Análise de padrões
      const analysis = {
        summary: {
          total: logs.length,
          success_count: successes.length,
          failure_count: failures.length,
          success_rate: ((successes.length / logs.length) * 100).toFixed(2) + '%',
        },

        phone_format_comparison: {
          success_phones: successes.map((l: any) => ({
            phone: l.customer_phone,
            length: l.phone_length,
            country_code: l.country_code,
          })).slice(0, 5),

          failed_phones: failures.map((l: any) => ({
            phone: l.customer_phone,
            length: l.phone_length,
            country_code: l.country_code,
            error: l.error_message,
          })).slice(0, 10),
        },

        length_distribution: {
          success_lengths: [...new Set(successes.map((l: any) => l.phone_length))],
          failure_lengths: [...new Set(failures.map((l: any) => l.phone_length))],
        },

        error_breakdown: failures.reduce((acc: any, log: any) => {
          const key = log.error_message || 'Unknown'
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {}),

        specific_failures: failures
          .filter((l: any) =>
            l.customer_phone.includes('98027292') ||
            l.customer_phone.includes('92489909')
          )
          .map((l: any) => ({
            phone: l.customer_phone,
            error: l.error_message,
            error_code: l.error_code,
            message_preview: l.message_content?.substring(0, 100),
            date: l.created_at,
          })),
      }

      return response.ok({
        success: true,
        data: analysis,
      })
    } catch (error: any) {
      console.error('[Admin Logs] Erro ao analisar falhas:', error.message)
      return response.internalServerError({
        error: 'Failed to analyze failures',
        details: error.message,
      })
    }
  }
}
