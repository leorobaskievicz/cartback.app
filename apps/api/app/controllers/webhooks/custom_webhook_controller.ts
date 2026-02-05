import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import AbandonedCart from '#models/abandoned_cart'
import queueService from '#jobs/queue_service'
import customWebhookService from '#services/custom_webhook_service'
import { DateTime } from 'luxon'

export default class CustomWebhookController {
  /**
   * POST /api/webhooks/custom/:tenantUuid
   * Recebe webhook de carrinho abandonado de integração personalizada
   */
  async receive({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Custom Webhook] Recebido webhook (tenant: ${tenantUuid})`)

    // Buscar tenant
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Custom Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
      return response.notFound({ error: 'Tenant not found' })
    }

    // Buscar integração webhook personalizada
    const integration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .where('is_active', true)
      .first()

    if (!integration) {
      console.error(`[Custom Webhook] Integração webhook não encontrada para tenant ${tenant.id}`)
      return response.notFound({ error: 'Webhook integration not found' })
    }

    // Validar API Key
    const apiKey = request.header('X-CartBack-API-Key')

    if (!apiKey) {
      console.error(`[Custom Webhook] API Key não fornecida`)
      return response.unauthorized({ error: 'Missing API Key' })
    }

    if (!integration.webhookSecret) {
      console.error(`[Custom Webhook] Integração sem API Key configurada`)
      return response.internalServerError({ error: 'Integration misconfigured' })
    }

    try {
      const isValid = customWebhookService.validateApiKey(apiKey, integration.webhookSecret)

      if (!isValid) {
        console.error(`[Custom Webhook] API Key inválida`)
        return response.unauthorized({ error: 'Invalid API Key' })
      }
    } catch (error: any) {
      console.error(`[Custom Webhook] Erro ao validar API Key:`, error.message)
      return response.unauthorized({ error: 'Invalid API Key' })
    }

    console.log(`[Custom Webhook] ✅ API Key validada`)

    try {
      // Parsear e validar payload
      const cartData = customWebhookService.parseWebhookPayload(payload)

      console.log(
        `[Custom Webhook] Carrinho ${cartData.cartId}: ${cartData.customerName || 'Sem nome'} - ${cartData.customerPhone}`
      )

      // Adicionar à fila de processamento
      await queueService.addJob('process-abandoned-cart', {
        tenantId: tenant.id,
        storeIntegrationId: integration.id,
        externalCartId: cartData.cartId,
        customerName: cartData.customerName,
        customerEmail: cartData.customerEmail,
        customerPhone: cartData.customerPhone,
        cartUrl: cartData.cartUrl,
        totalValue: cartData.totalValue,
        items: cartData.items,
      })

      console.log(
        `[Custom Webhook] ✅ Carrinho ${cartData.cartId} adicionado à fila de processamento`
      )

      return response.ok({
        success: true,
        message: 'Webhook received and queued for processing',
        cart_id: cartData.cartId,
      })
    } catch (error: any) {
      console.error('[Custom Webhook] Erro ao processar:', error.message)
      return response.badRequest({
        error: 'Invalid webhook payload',
        details: error.message,
      })
    }
  }

  /**
   * POST /api/webhooks/custom/:tenantUuid/order
   * Recebe webhook de pedido criado (para marcar carrinho como recuperado)
   */
  async orderCreated({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Custom Webhook] Recebido webhook de pedido (tenant: ${tenantUuid})`)

    // Buscar tenant
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Custom Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
      return response.notFound({ error: 'Tenant not found' })
    }

    // Buscar integração webhook personalizada
    const integration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .where('is_active', true)
      .first()

    if (!integration) {
      console.error(`[Custom Webhook] Integração webhook não encontrada para tenant ${tenant.id}`)
      return response.notFound({ error: 'Webhook integration not found' })
    }

    // Validar API Key
    const apiKey = request.header('X-CartBack-API-Key')

    if (!apiKey) {
      console.error(`[Custom Webhook] API Key não fornecida`)
      return response.unauthorized({ error: 'Missing API Key' })
    }

    if (!integration.webhookSecret) {
      console.error(`[Custom Webhook] Integração sem API Key configurada`)
      return response.internalServerError({ error: 'Integration misconfigured' })
    }

    try {
      const isValid = customWebhookService.validateApiKey(apiKey, integration.webhookSecret)

      if (!isValid) {
        console.error(`[Custom Webhook] API Key inválida`)
        return response.unauthorized({ error: 'Invalid API Key' })
      }
    } catch (error: any) {
      console.error(`[Custom Webhook] Erro ao validar API Key:`, error.message)
      return response.unauthorized({ error: 'Invalid API Key' })
    }

    console.log(`[Custom Webhook] ✅ API Key validada`)

    try {
      // Parsear e validar payload
      const orderData = customWebhookService.parseOrderWebhook(payload)

      console.log(
        `[Custom Webhook] Pedido ${orderData.orderNumber || orderData.orderId}: ${orderData.customerName || 'Sem nome'} - ${orderData.customerPhone || orderData.customerEmail}`
      )

      // Buscar carrinhos pending desse cliente
      const query = AbandonedCart.query()
        .where('tenant_id', tenant.id)
        .where('store_integration_id', integration.id)
        .where('status', 'pending')

      // Filtrar por telefone OU email
      if (orderData.customerPhone) {
        query.where('customer_phone', orderData.customerPhone)
      } else if (orderData.customerEmail) {
        query.where('customer_email', orderData.customerEmail)
      }

      const pendingCarts = await query

      if (pendingCarts.length === 0) {
        console.log(`[Custom Webhook] Nenhum carrinho pending encontrado para este cliente`)
        return response.ok({ success: true, recovered: 0 })
      }

      // Marcar carrinhos como recuperados ou concluídos
      let recoveredCount = 0
      let completedCount = 0

      for (const cart of pendingCarts) {
        // Verificar se teve mensagens enviadas pelo CartBack
        const sentMessage = await cart
          .related('messageLogs')
          .query()
          .where('status', 'sent')
          .first()

        if (sentMessage) {
          // Teve mensagens enviadas → RECUPERADO (CartBack ajudou)
          cart.status = 'recovered'
          cart.recoveredAt = DateTime.now()
          recoveredCount++
          console.log(`[Custom Webhook] ✅ Carrinho ${cart.id} marcado como RECUPERADO`)
        } else {
          // Não teve mensagens → CONCLUÍDO (cliente finalizou sozinho)
          cart.status = 'completed'
          cart.recoveredAt = DateTime.now()
          completedCount++
          console.log(`[Custom Webhook] ✅ Carrinho ${cart.id} marcado como CONCLUÍDO`)
        }

        await cart.save()

        // Cancelar mensagens pendentes deste carrinho
        await queueService.removeCartJobs(cart.id)

        // Marcar mensagens como canceladas
        const queuedMessages = await cart.related('messageLogs').query().where('status', 'queued')

        for (const messageLog of queuedMessages) {
          messageLog.status = 'cancelled'
          messageLog.errorMessage = 'Pedido criado - mensagens canceladas'
          await messageLog.save()
        }
      }

      return response.ok({
        success: true,
        recovered: recoveredCount,
        completed: completedCount,
        total: recoveredCount + completedCount,
        message: `${recoveredCount} cart(s) recovered, ${completedCount} cart(s) completed`,
      })
    } catch (error: any) {
      console.error('[Custom Webhook] Erro ao processar pedido:', error.message)
      return response.badRequest({
        error: 'Invalid order payload',
        details: error.message,
      })
    }
  }

  /**
   * GET /api/webhooks/custom/docs
   * Retorna documentação do webhook
   */
  async docs({ response }: HttpContext) {
    const documentation = customWebhookService.getPayloadDocumentation()

    return response.ok({
      success: true,
      data: documentation,
    })
  }
}
