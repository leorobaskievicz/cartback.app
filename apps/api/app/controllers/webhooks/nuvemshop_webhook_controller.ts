import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import StoreIntegration from '#models/store_integration'
import AbandonedCart from '#models/abandoned_cart'
import queueService from '#jobs/queue_service'
import nuvemshopService from '#services/nuvemshop_service'
import { DateTime } from 'luxon'

export default class NuvemshopWebhookController {
  /**
   * POST /api/webhooks/nuvemshop/:tenantUuid
   * Recebe webhook de carrinho abandonado da Nuvemshop
   */
  async abandonedCart({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Nuvemshop Webhook] Recebido: cart/abandoned (tenant: ${tenantUuid})`)

    // Buscar tenant
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Nuvemshop Webhook] Tenant ${tenantUuid} não encontrado ou inativo`)
      return response.notFound({ error: 'Tenant not found' })
    }

    // Buscar integração
    const integration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'nuvemshop')
      .where('is_active', true)
      .first()

    if (!integration) {
      console.error(`[Nuvemshop Webhook] Integração não encontrada para tenant ${tenant.id}`)
      return response.notFound({ error: 'Integration not found' })
    }

    // Validar assinatura HMAC
    const signature = request.header('X-Linkedstore-HMAC-SHA256')
    if (signature) {
      const payloadString = JSON.stringify(payload)
      const isValid = nuvemshopService.validateWebhookSignature(payloadString, signature)

      if (!isValid) {
        console.error(`[Nuvemshop Webhook] Assinatura inválida para tenant ${tenant.id}`)
        return response.forbidden({ error: 'Invalid signature' })
      }
      console.log(`[Nuvemshop Webhook] ✅ Assinatura validada`)
    } else {
      console.warn(`[Nuvemshop Webhook] ⚠️ Webhook sem assinatura HMAC`)
    }

    try {
      // Parsear dados do webhook
      const cartData = nuvemshopService.parseAbandonedCartWebhook(payload)

      console.log(
        `[Nuvemshop Webhook] Carrinho ${cartData.checkoutId}: ${cartData.customerName || 'Sem nome'} - ${cartData.customerPhone || 'Sem telefone'}`
      )

      // Validar se tem telefone (obrigatório para WhatsApp)
      if (!cartData.customerPhone) {
        console.log(`[Nuvemshop Webhook] Carrinho ${cartData.checkoutId} sem telefone, ignorando`)
        return response.ok({ received: true, processed: false, reason: 'no_phone' })
      }

      // Adicionar à fila de processamento
      await queueService.addJob('process-abandoned-cart', {
        tenantId: tenant.id,
        storeIntegrationId: integration.id,
        externalCartId: String(cartData.checkoutId),
        customerName: cartData.customerName,
        customerEmail: cartData.customerEmail,
        customerPhone: cartData.customerPhone,
        cartUrl: cartData.checkoutUrl,
        totalValue: cartData.total,
        items: cartData.products,
      })

      console.log(
        `[Nuvemshop Webhook] ✅ Carrinho ${cartData.checkoutId} adicionado à fila de processamento`
      )

      return response.ok({ received: true, processed: true })
    } catch (error: any) {
      console.error('[Nuvemshop Webhook] Erro ao processar:', error.message)
      return response.badRequest({ error: 'Processing failed', details: error.message })
    }
  }

  /**
   * POST /api/webhooks/nuvemshop/:tenantUuid/order
   * Recebe webhook de pedido criado (para detectar recuperação)
   */
  async orderCreated({ request, response, params }: HttpContext) {
    const { tenantUuid } = params
    const payload = request.body()

    console.log(`[Nuvemshop Webhook] Recebido: order/created (tenant: ${tenantUuid})`)

    // Buscar tenant
    const tenant = await Tenant.query().where('uuid', tenantUuid).where('is_active', true).first()

    if (!tenant) {
      console.error(`[Nuvemshop Webhook] Tenant ${tenantUuid} não encontrado`)
      return response.notFound({ error: 'Tenant not found' })
    }

    // Validar assinatura HMAC
    const signature = request.header('X-Linkedstore-HMAC-SHA256')
    if (signature) {
      const payloadString = JSON.stringify(payload)
      const isValid = nuvemshopService.validateWebhookSignature(payloadString, signature)

      if (!isValid) {
        console.error(`[Nuvemshop Webhook] Assinatura inválida para tenant ${tenant.id}`)
        return response.forbidden({ error: 'Invalid signature' })
      }
      console.log(`[Nuvemshop Webhook] ✅ Assinatura validada`)
    } else {
      console.warn(`[Nuvemshop Webhook] ⚠️ Webhook sem assinatura HMAC`)
    }

    try {
      // Parsear dados do pedido
      const orderData = nuvemshopService.parseOrderWebhook(payload)

      console.log(
        `[Nuvemshop Webhook] Pedido ${orderData.orderNumber} criado: ${orderData.customerName} - ${orderData.customerPhone || orderData.customerEmail}`
      )

      // Buscar carrinhos pending desse cliente
      const query = AbandonedCart.query()
        .where('tenant_id', tenant.id)
        .where('status', 'pending')

      // Filtrar por telefone OU email
      if (orderData.customerPhone) {
        query.orWhere('customer_phone', orderData.customerPhone)
      }
      if (orderData.customerEmail) {
        query.orWhere('customer_email', orderData.customerEmail)
      }

      const pendingCarts = await query

      if (pendingCarts.length === 0) {
        console.log(`[Nuvemshop Webhook] Nenhum carrinho pending encontrado para este cliente`)
        return response.ok({ received: true, recovered: 0 })
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
          console.log(`[Nuvemshop Webhook] ✅ Carrinho ${cart.id} marcado como RECUPERADO`)
        } else {
          // Não teve mensagens → CONCLUÍDO (cliente finalizou sozinho)
          cart.status = 'completed'
          cart.recoveredAt = DateTime.now()
          completedCount++
          console.log(`[Nuvemshop Webhook] ✅ Carrinho ${cart.id} marcado como CONCLUÍDO`)
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
        received: true,
        recovered: recoveredCount,
        completed: completedCount,
        total: recoveredCount + completedCount,
      })
    } catch (error: any) {
      console.error('[Nuvemshop Webhook] Erro ao processar order:', error.message)
      return response.badRequest({ error: 'Processing failed', details: error.message })
    }
  }
}
