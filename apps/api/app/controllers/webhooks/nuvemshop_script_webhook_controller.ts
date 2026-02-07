import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import queueService from '#jobs/queue_service'
import { DateTime } from 'luxon'

/**
 * Controller para receber webhooks do script JavaScript
 * da Nuvemshop (detecção de abandono em tempo real)
 */
export default class NuvemshopScriptWebhookController {
  /**
   * POST /api/webhooks/nuvemshop-script/:tenantUuid
   *
   * Recebe dados de carrinho abandonado do script JS
   * rodando no checkout da Nuvemshop
   */
  async handle({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(
      `[Nuvemshop Script Webhook] Recebido para tenant ${tenantUuid}:`,
      JSON.stringify(payload, null, 2)
    )

    // 1. Validar tenant
    const tenant = await Tenant.query().where('uuid', tenantUuid).first()

    if (!tenant) {
      console.error(`[Nuvemshop Script Webhook] Tenant não encontrado: ${tenantUuid}`)
      return response.notFound({ error: 'Tenant not found' })
    }

    if (!tenant.isActive) {
      console.error(`[Nuvemshop Script Webhook] Tenant inativo: ${tenantUuid}`)
      return response.forbidden({ error: 'Tenant inactive' })
    }

    // 2. Validar integração Nuvemshop ativa
    const integration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'nuvemshop')
      .where('is_active', true)
      .first()

    if (!integration) {
      console.error(
        `[Nuvemshop Script Webhook] Integração Nuvemshop não encontrada para tenant ${tenant.id}`
      )
      return response.notFound({ error: 'Nuvemshop integration not found' })
    }

    // 3. Validar dados mínimos
    if (!payload.customer_phone) {
      console.log('[Nuvemshop Script Webhook] Sem telefone, ignorando...')
      return response.ok({ received: true, processed: false, reason: 'No phone number' })
    }

    if (!payload.customer_name && !payload.customer_email) {
      console.log('[Nuvemshop Script Webhook] Sem nome ou email, ignorando...')
      return response.ok({ received: true, processed: false, reason: 'No name or email' })
    }

    // 4. Normalizar dados
    const cartData = {
      tenantId: tenant.id,
      platform: 'nuvemshop',
      externalCartId: String(payload.checkout_id || `script-${Date.now()}`),
      customerName: payload.customer_name || 'Cliente',
      customerEmail: payload.customer_email || null,
      customerPhone: payload.customer_phone,
      cartUrl: payload.cart_url || payload.page_url,
      totalValue: parseFloat(payload.total_value || 0),
      currency: payload.currency || 'BRL',
      items: payload.items || [],
      metadata: {
        source: 'nuvemshop-script',
        store_id: payload.store_id,
        user_agent: payload.user_agent,
        page_title: payload.page_title,
        collected_at: payload.timestamp || DateTime.now().toISO(),
      },
    }

    console.log('[Nuvemshop Script Webhook] Dados normalizados:', {
      externalCartId: cartData.externalCartId,
      customer: cartData.customerName,
      phone: cartData.customerPhone,
      total: cartData.totalValue,
      items: cartData.items.length,
    })

    try {
      // 5. Adicionar na fila de processamento
      // O job process-abandoned-cart já trata duplicatas via externalCartId
      await queueService.addJob('process-abandoned-cart', cartData)

      console.log(
        `[Nuvemshop Script Webhook] ✅ Carrinho adicionado à fila (${cartData.externalCartId})`
      )

      return response.ok({
        received: true,
        processed: true,
        cart_id: cartData.externalCartId,
      })
    } catch (error: any) {
      console.error('[Nuvemshop Script Webhook] Erro ao processar:', error.message)

      return response.internalServerError({
        received: true,
        processed: false,
        error: error.message,
      })
    }
  }
}
