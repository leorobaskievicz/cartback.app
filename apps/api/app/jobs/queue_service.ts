import { Queue, Worker, Job } from 'bullmq'
import { Redis as IORedis } from 'ioredis'
import env from '#start/env'

/**
 * Gerenciador central de filas com BullMQ
 * Centraliza a criação de queues e workers
 */
class QueueService {
  private connection: IORedis
  private queues: Map<string, Queue> = new Map()
  private workers: Map<string, Worker> = new Map()

  constructor() {
    const redisUrl = env.get('REDIS_URL', 'redis://localhost:6379')

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

    this.connection.on('error', (error: Error) => {
      console.error('Redis connection error:', error)
    })

    this.connection.on('connect', () => {
      console.log('✅ Redis connected for BullMQ')
    })
  }

  /**
   * Obtém ou cria uma fila
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: this.connection })
      this.queues.set(name, queue)
    }
    return this.queues.get(name)!
  }

  /**
   * Registra um worker para processar jobs
   */
  registerWorker(name: string, processor: (job: Job) => Promise<void>): void {
    if (this.workers.has(name)) {
      console.warn(`Worker ${name} já registrado, ignorando`)
      return
    }

    const worker = new Worker(name, processor, {
      connection: this.connection,
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    })

    worker.on('completed', (job) => {
      console.log(`✅ [${name}] Job ${job.id} completed`)
    })

    worker.on('failed', (job, err) => {
      console.error(`❌ [${name}] Job ${job?.id} failed:`, err.message)
    })

    worker.on('error', (err) => {
      console.error(`❌ [${name}] Worker error:`, err)
    })

    this.workers.set(name, worker)
    console.log(`✅ Worker registered: ${name}`)
  }

  /**
   * Adiciona um job à fila
   */
  async addJob(
    queueName: string,
    data: any,
    options?: { delay?: number; jobId?: string; priority?: number }
  ): Promise<Job> {
    const queue = this.getQueue(queueName)

    return queue.add(queueName, data, {
      delay: options?.delay,
      jobId: options?.jobId,
      priority: options?.priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    })
  }

  /**
   * Remove um job específico da fila
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)

    if (job) {
      await job.remove()
      console.log(`🗑️  Job ${jobId} removido da fila ${queueName}`)
    }
  }

  /**
   * Remove todos os jobs relacionados a um carrinho
   */
  async removeCartJobs(cartId: number): Promise<void> {
    // Remove jobs de envio de mensagem
    const sendQueue = this.getQueue('send-whatsapp-message')
    const sendJobs = await sendQueue.getJobs(['waiting', 'delayed'])

    for (const job of sendJobs) {
      if (job.data.cartId === cartId) {
        await job.remove()
        console.log(`🗑️  Job de envio ${job.id} removido (carrinho ${cartId})`)
      }
    }

    // Remove job de verificação
    const checkQueue = this.getQueue('check-cart-recovered')
    const checkJobs = await checkQueue.getJobs(['waiting', 'delayed'])

    for (const job of checkJobs) {
      if (job.data.cartId === cartId) {
        await job.remove()
        console.log(`🗑️  Job de verificação ${job.id} removido (carrinho ${cartId})`)
      }
    }
  }

  /**
   * Obtém estatísticas de uma fila
   */
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName)

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    }
  }

  /**
   * Fecha todas as conexões (chamado no shutdown)
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Fechando workers...')

    for (const [name, worker] of this.workers.entries()) {
      await worker.close()
      console.log(`✅ Worker ${name} fechado`)
    }

    console.log('🔄 Fechando filas...')

    for (const [name, queue] of this.queues.entries()) {
      await queue.close()
      console.log(`✅ Fila ${name} fechada`)
    }

    console.log('🔄 Fechando conexão Redis...')
    await this.connection.quit()
    console.log('✅ Redis desconectado')
  }
}

// Exportar como singleton
export default new QueueService()
