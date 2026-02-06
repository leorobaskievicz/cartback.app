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
        const queueService = await app.container.make('queue_service')

        // Import and register all workers
        const { default: processAbandonedCart } = await import('#jobs/process_abandoned_cart')
        const { default: sendWhatsAppMessage } = await import('#jobs/send_whatsapp_message')
        const { default: checkCartRecovered } = await import('#jobs/check_cart_recovered')

        queueService.registerWorker('process-abandoned-cart', processAbandonedCart)
        queueService.registerWorker('send-whatsapp-message', sendWhatsAppMessage)
        queueService.registerWorker('check-cart-recovered', checkCartRecovered)

        console.log('✅ Workers initialized and running')

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
