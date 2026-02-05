import type { ApplicationService } from '@adonisjs/core/types'
import queueService from '#jobs/queue_service'
import { processAbandonedCart } from '#jobs/process_abandoned_cart'
import { sendWhatsappMessage } from '#jobs/send_whatsapp_message'
import { checkCartRecovered } from '#jobs/check_cart_recovered'

/**
 * QueueProvider
 *
 * Provider do AdonisJS que inicializa os workers do BullMQ
 * quando a aplicação inicia e fecha as conexões no shutdown
 */
export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Chamado quando a aplicação inicia
   * Registra todos os workers para processar jobs
   */
  async boot() {
    console.log('🔄 Inicializando sistema de filas...')

    // Registrar worker para processar carrinhos abandonados
    queueService.registerWorker('process-abandoned-cart', processAbandonedCart)

    // Registrar worker para enviar mensagens WhatsApp
    queueService.registerWorker('send-whatsapp-message', sendWhatsappMessage)

    // Registrar worker para verificar carrinhos recuperados
    queueService.registerWorker('check-cart-recovered', checkCartRecovered)

    console.log('✅ Sistema de filas inicializado com 3 workers')
  }

  /**
   * Chamado quando a aplicação está sendo encerrada
   * Fecha todas as conexões e workers gracefully
   */
  async shutdown() {
    console.log('🔄 Encerrando sistema de filas...')
    await queueService.shutdown()
    console.log('✅ Sistema de filas encerrado')
  }
}
