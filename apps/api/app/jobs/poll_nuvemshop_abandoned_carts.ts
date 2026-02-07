import { Job } from 'bullmq'
import StoreIntegration from '#models/store_integration'
import nuvemshopService from '#services/nuvemshop_service'
import queueService from '#jobs/queue_service'
import { DateTime } from 'luxon'

/**
 * Job que faz polling de carrinhos abandonados da Nuvemshop
 *
 * A Nuvemshop NÃO tem webhook de carrinho abandonado.
 * Carrinhos são criados até 6h após o abandono e ficam disponíveis por 30 dias.
 *
 * Este job roda periodicamente (a cada 15 minutos) e:
 * 1. Busca todas as integrações Nuvemshop ativas
 * 2. Para cada integração, busca carrinhos abandonados recentes
 * 3. Adiciona na fila de processamento (evitando duplicatas)
 */
export async function pollNuvemshopAbandonedCarts(job: Job): Promise<void> {
  console.log('[Poll Nuvemshop] Iniciando busca de carrinhos abandonados...')

  // Buscar todas as integrações ativas da Nuvemshop
  const integrations = await StoreIntegration.query()
    .where('platform', 'nuvemshop')
    .where('is_active', true)

  if (integrations.length === 0) {
    console.log('[Poll Nuvemshop] Nenhuma integração ativa encontrada')
    return
  }

  console.log(`[Poll Nuvemshop] Encontradas ${integrations.length} integrações ativas`)

  let totalCartsFound = 0
  let totalCartsQueued = 0

  for (const integration of integrations) {
    try {
      if (!integration.accessToken || !integration.storeId) {
        console.log(
          `[Poll Nuvemshop] Integração ${integration.id} sem token ou storeId, pulando...`
        )
        continue
      }

      console.log(
        `[Poll Nuvemshop] Buscando carrinhos da loja ${integration.storeName} (ID: ${integration.storeId})...`
      )

      // Buscar carrinhos criados nas últimas 24 horas
      const since = DateTime.now().minus({ hours: 24 }).toISO()

      const abandonedCheckouts = await nuvemshopService.listAbandonedCheckouts(
        parseInt(integration.storeId),
        integration.accessToken,
        {
          created_at_min: since,
        }
      )

      console.log(
        `[Poll Nuvemshop] Loja ${integration.storeName}: ${abandonedCheckouts.length} carrinhos encontrados`
      )

      totalCartsFound += abandonedCheckouts.length

      // Processar cada carrinho
      for (const checkout of abandonedCheckouts) {
        const cartData = nuvemshopService.parseAbandonedCartWebhook(checkout)

        // Pular se não tiver telefone
        if (!cartData.customerPhone) {
          console.log(
            `[Poll Nuvemshop] Carrinho ${cartData.checkoutId}: sem telefone, pulando...`
          )
          continue
        }

        // Adicionar na fila de processamento
        // O job process-abandoned-cart já trata duplicatas
        await queueService.addJob('process-abandoned-cart', {
          tenantId: integration.tenantId,
          platform: 'nuvemshop',
          externalCartId: String(cartData.checkoutId),
          customerName: cartData.customerName,
          customerEmail: cartData.customerEmail,
          customerPhone: cartData.customerPhone,
          cartUrl: cartData.checkoutUrl,
          totalValue: cartData.total,
          items: cartData.products,
        })

        totalCartsQueued++
        console.log(
          `[Poll Nuvemshop] Carrinho ${cartData.checkoutId} adicionado à fila (cliente: ${cartData.customerName})`
        )
      }
    } catch (error: any) {
      console.error(
        `[Poll Nuvemshop] Erro ao processar integração ${integration.id}:`,
        error.message
      )
      // Continua para próxima integração mesmo com erro
    }
  }

  console.log(
    `[Poll Nuvemshop] ✅ Concluído: ${totalCartsFound} carrinhos encontrados, ${totalCartsQueued} adicionados à fila`
  )
}
