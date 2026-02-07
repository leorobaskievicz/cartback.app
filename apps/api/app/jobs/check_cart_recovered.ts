import { Job } from 'bullmq'
import AbandonedCart from '#models/abandoned_cart'
import queueService from '#jobs/queue_service'
import { DateTime } from 'luxon'

/**
 * Dados do job de verificação de recuperação
 */
export interface CheckCartData {
  cartId: number
  tenantId: number
}

/**
 * Job que verifica se carrinho foi recuperado ou expirou
 *
 * Fluxo:
 * 1. Busca o carrinho no banco
 * 2. Se status mudou (recovered/cancelled), não faz nada
 * 3. Se ainda pending e não expirou, re-agenda para +12h
 * 4. Se expirou, marca como expired
 *
 * Nota: Em produção, aqui você pode consultar a API da loja
 * (Nuvemshop, Shopify, etc) para verificar se o pedido foi concluído
 */
export async function checkCartRecovered(job: Job<CheckCartData>): Promise<void> {
  const { cartId, tenantId } = job.data

  console.log(`[CheckCart] Verificando status do carrinho ${cartId}`)

  const cart = await AbandonedCart.find(cartId)

  if (!cart) {
    console.log(`[CheckCart] Carrinho ${cartId} não encontrado`)
    return
  }

  // Se carrinho já foi recuperado ou cancelado, finalizar
  if (cart.status === 'recovered') {
    console.log(`[CheckCart] Carrinho ${cartId} foi recuperado, nada a fazer`)
    return
  }

  if (cart.status === 'cancelled') {
    console.log(`[CheckCart] Carrinho ${cartId} foi cancelado, nada a fazer`)
    return
  }

  if (cart.status === 'expired') {
    console.log(`[CheckCart] Carrinho ${cartId} já está expirado, nada a fazer`)
    return
  }

  // Se ainda está pending, verificar se expirou
  const now = DateTime.now()

  if (cart.expiresAt && now >= cart.expiresAt) {
    // Carrinho expirou
    cart.status = 'expired'
    await cart.save()
    console.log(`[CheckCart] ⏱️  Carrinho ${cartId} expirou`)
  } else {
    // Ainda não expirou, re-agendar para verificar novamente em 12h
    await queueService.addJob(
      'check-cart-recovered',
      {
        cartId: cart.id,
        tenantId: cart.tenantId,
      },
      {
        delay: 12 * 60 * 60 * 1000, // 12 horas
        jobId: `check-${cart.id}-${Date.now()}`, // ID único para evitar duplicatas
      }
    )

    console.log(`[CheckCart] Carrinho ${cartId} ainda pending, re-agendado para +12h`)
  }

  // TODO: Integração futura com API da loja
  // Exemplo: consultar API da Nuvemshop para verificar se pedido foi criado
  // const order = await nuvemshopService.getOrderByCartId(cart.externalCartId)
  // if (order) {
  //   cart.status = 'recovered'
  //   cart.recoveredAt = DateTime.now()
  //   await cart.save()
  //   await queueService.removeCartJobs(cart.id) // Cancelar mensagens pendentes
  // }
}

export default checkCartRecovered
