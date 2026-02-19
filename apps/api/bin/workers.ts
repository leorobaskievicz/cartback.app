import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

try {
  const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER })

  await ignitor
    .tap((app) => {
      app.booting(async () => {
        await import('#start/env')
      })

      app.ready(async () => {
        // Import queue service directly (singleton)
        const queueService = (await import('#jobs/queue_service')).default

        // Import and register all workers
        const { default: processAbandonedCart } = await import('#jobs/process_abandoned_cart')
        const { default: sendWhatsAppMessage } = await import('#jobs/send_whatsapp_message')
        const { default: sendWhatsappOfficialMessage } = await import(
          '#jobs/send_whatsapp_official_message'
        )
        const { default: checkCartRecovered } = await import('#jobs/check_cart_recovered')
        const { default: pollNuvemshopAbandonedCarts } = await import(
          '#jobs/poll_nuvemshop_abandoned_carts'
        )

        queueService.registerWorker('process-abandoned-cart', processAbandonedCart)
        queueService.registerWorker('send-whatsapp-message', sendWhatsAppMessage)
        queueService.registerWorker('send-whatsapp-official-message', sendWhatsappOfficialMessage)
        queueService.registerWorker('check-cart-recovered', checkCartRecovered)
        queueService.registerWorker('poll-nuvemshop-carts', pollNuvemshopAbandonedCarts)

        // Agendar polling de carrinhos Nuvemshop a cada 10 minutos
        // Solução sem script: busca carrinhos abandonados via API REST
        await queueService.addRepeatingJob(
          'poll-nuvemshop-carts',
          {},
          {
            pattern: '*/10 * * * *', // A cada 10 minutos
            jobId: 'poll-nuvemshop',
          }
        )

        console.log('✅ Workers initialized and running')
        console.log('🔄 Polling Nuvemshop: a cada 10 minutos via API REST')

        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
          console.log('SIGTERM received, shutting down workers...')
          await queueService.shutdown()
          process.exit(0)
        })

        process.on('SIGINT', async () => {
          console.log('SIGINT received, shutting down workers...')
          await queueService.shutdown()
          process.exit(0)
        })
      })

      app.listen('SIGTERM', () => app.terminate())
      app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
    })
    .httpServer()
    .start()
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
