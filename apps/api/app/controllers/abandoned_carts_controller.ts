import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import AbandonedCart from '#models/abandoned_cart'
import MessageLog from '#models/message_log'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import MessageTemplate from '#models/message_template'

export default class AbandonedCartsController {
  /**
   * GET /api/carts
   * Lista carrinhos abandonados (paginado + filtros)
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')
    const search = request.input('search')

    const query = AbandonedCart.query()
      .where('tenant_id', tenant.id)
      .preload('storeIntegration')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query.where((builder) => {
        builder
          .where('customer_name', 'like', `%${search}%`)
          .orWhere('customer_email', 'like', `%${search}%`)
          .orWhere('customer_phone', 'like', `%${search}%`)
      })
    }

    const carts = await query.paginate(page, limit)

    return response.ok({
      success: true,
      data: carts.serialize({
        fields: {
          pick: [
            'id',
            'externalCartId',
            'customerName',
            'customerEmail',
            'customerPhone',
            'totalValue',
            'currency',
            'status',
            'createdAt',
            'recoveredAt',
          ],
        },
      }),
    })
  }

  /**
   * GET /api/carts/:id
   * Detalhe do carrinho + logs de mensagem
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const cart = await AbandonedCart.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('storeIntegration')
      .firstOrFail()

    // Carregar logs de mensagem (Evolution API)
    const messageLogs = await MessageLog.query()
      .where('abandoned_cart_id', cart.id)
      .preload('messageTemplate')
      .orderBy('created_at', 'asc')

    // Carregar logs de mensagem (API Oficial)
    const officialLogs = await WhatsappOfficialLog.query()
      .where('abandoned_cart_id', cart.id)
      .orderBy('created_at', 'asc')

    // Buscar templates dos logs oficiais
    const officialTemplateIds = officialLogs
      .map((log) => log.officialTemplateId)
      .filter((id) => id !== null)
    const officialTemplates = await MessageTemplate.query().whereIn('id', officialTemplateIds)
    const templateMap = new Map(officialTemplates.map((t) => [t.id, t]))

    // Mesclar ambos os logs em um único array
    const allMessages = [
      ...messageLogs.map((log) => ({
        id: `msg-${log.id}`,
        type: 'evolution' as const,
        templateName: log.messageTemplate.name,
        delayMinutes: log.messageTemplate.delayMinutes,
        content: log.content,
        status: log.status,
        sentAt: log.sentAt,
        deliveredAt: log.deliveredAt,
        readAt: log.readAt,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      ...officialLogs.map((log) => {
        const template = log.officialTemplateId ? templateMap.get(log.officialTemplateId) : null
        return {
          id: `official-${log.id}`,
          type: 'official' as const,
          templateName: log.templateName,
          delayMinutes: template?.delayMinutes || null,
          messageType: log.messageType,
          languageCode: log.languageCode,
          status: log.status,
          sentAt: log.sentAt,
          metaMessageId: log.metaMessageId,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        }
      }),
    ]

    // Ordenar por data de criação
    allMessages.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    })

    return response.ok({
      success: true,
      data: {
        cart: {
          id: cart.id,
          externalCartId: cart.externalCartId,
          customerName: cart.customerName,
          customerEmail: cart.customerEmail,
          customerPhone: cart.customerPhone,
          cartUrl: cart.cartUrl,
          totalValue: cart.totalValue,
          currency: cart.currency,
          items: cart.items,
          status: cart.status,
          recoveredAt: cart.recoveredAt,
          expiresAt: cart.expiresAt,
          createdAt: cart.createdAt,
          storeIntegration: {
            platform: cart.storeIntegration.platform,
            storeName: cart.storeIntegration.storeName,
          },
        },
        messages: allMessages,
      },
    })
  }

  /**
   * PUT /api/carts/:id/cancel
   * Cancela recuperação do carrinho
   */
  async cancel({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const cart = await AbandonedCart.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    cart.status = 'cancelled'
    await cart.save()

    return response.ok({
      success: true,
      data: {
        id: cart.id,
        status: cart.status,
      },
    })
  }
}
