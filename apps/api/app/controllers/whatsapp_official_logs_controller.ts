import type { HttpContext } from '@adonisjs/core/http'
import WhatsappOfficialLog from '#models/whatsapp_official_log'

export default class WhatsappOfficialLogsController {
  /**
   * GET /api/whatsapp-official/logs
   * Lista os logs de disparo com paginação e filtros
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const status = request.input('status')
    const templateName = request.input('templateName')
    const phone = request.input('phone')

    const query = WhatsappOfficialLog.query()
      .where('tenant_id', user.tenantId)
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (templateName) {
      query.where('template_name', templateName)
    }

    if (phone) {
      query.where('recipient_phone', 'like', `%${phone}%`)
    }

    const logs = await query.paginate(page, perPage)

    return response.ok({
      success: true,
      data: logs,
    })
  }

  /**
   * GET /api/whatsapp-official/logs/:id
   * Detalhes de um log específico
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const log = await WhatsappOfficialLog.query()
      .where('tenant_id', user.tenantId)
      .where('id', params.id)
      .firstOrFail()

    return response.ok({
      success: true,
      data: log,
    })
  }

  /**
   * GET /api/whatsapp-official/logs/stats
   * Estatísticas dos disparos
   */
  async stats({ auth, response }: HttpContext) {
    const user = auth.user!

    const [total, sent, delivered, read, failed] = await Promise.all([
      WhatsappOfficialLog.query().where('tenant_id', user.tenantId).count('id as total'),
      WhatsappOfficialLog.query().where('tenant_id', user.tenantId).where('status', 'sent').count('id as total'),
      WhatsappOfficialLog.query().where('tenant_id', user.tenantId).where('status', 'delivered').count('id as total'),
      WhatsappOfficialLog.query().where('tenant_id', user.tenantId).where('status', 'read').count('id as total'),
      WhatsappOfficialLog.query().where('tenant_id', user.tenantId).where('status', 'failed').count('id as total'),
    ])

    // Top templates mais usados
    const topTemplates = await WhatsappOfficialLog.query()
      .where('tenant_id', user.tenantId)
      .select('template_name')
      .count('id as count')
      .groupBy('template_name')
      .orderBy('count', 'desc')
      .limit(5)

    const totalCount = Number((total[0] as any).$extras.total || 0)
    const sentCount = Number((sent[0] as any).$extras.total || 0)
    const deliveredCount = Number((delivered[0] as any).$extras.total || 0)
    const readCount = Number((read[0] as any).$extras.total || 0)
    const failedCount = Number((failed[0] as any).$extras.total || 0)

    return response.ok({
      success: true,
      data: {
        total: totalCount,
        sent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        failed: failedCount,
        deliveryRate: totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0,
        readRate: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0,
        topTemplates: topTemplates.map((t: any) => ({
          name: t.templateName,
          count: Number(t.$extras.count),
        })),
      },
    })
  }
}
