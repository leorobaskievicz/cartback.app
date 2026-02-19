import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import WhatsappInstance from '#models/whatsapp_instance'
import WhatsappHealthMetric from '#models/whatsapp_health_metric'
import RateLimitConfig from '#models/rate_limit_config'
import evolutionApiService from '#services/evolution_api_service'
import WhatsappHealthService from '#services/whatsapp_health_service'
import { connectWhatsappValidator } from '#validators/whatsapp'
import { DateTime } from 'luxon'
import env from '#start/env'

export default class WhatsappController {
  /**
   * GET /api/whatsapp
   * Status da instância WhatsApp do tenant
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const instance = await WhatsappInstance.query().where('tenant_id', tenant.id).first()

    if (!instance) {
      return response.ok({
        success: true,
        data: {
          connected: false,
          instance: null,
        },
      })
    }

    // Buscar instância completa da Evolution API
    try {
      console.log(`🔍 Fetching instance status from Evolution API: ${instance.instanceName}`)
      const evolutionInstance = await evolutionApiService.fetchInstance(instance.instanceName)

      if (evolutionInstance) {
        console.log(`📊 Evolution API status: ${evolutionInstance.connectionStatus}, DB status: ${instance.status}`)

        // Sincronizar status
        if (evolutionInstance.connectionStatus === 'open' && instance.status !== 'connected') {
          instance.status = 'connected'
          instance.connectedAt = DateTime.now()
          instance.qrCode = null

          // Extrair número do telefone do ownerJid (formato: 5541999999999@s.whatsapp.net)
          if (evolutionInstance.ownerJid) {
            const phoneMatch = evolutionInstance.ownerJid.match(/^(\d+)@/)
            if (phoneMatch) {
              instance.phoneNumber = phoneMatch[1]
              console.log(`📱 Extracted phone number: ${instance.phoneNumber}`)
            }
          }

          await instance.save()
          console.log(`✅ Status synced: ${instance.instanceName} is now connected`)
        } else if (evolutionInstance.connectionStatus === 'close' && instance.status === 'connected') {
          instance.status = 'disconnected'
          instance.phoneNumber = null
          instance.connectedAt = null
          await instance.save()
          console.log(`❌ Status synced: ${instance.instanceName} is now disconnected`)
        } else if (evolutionInstance.connectionStatus === 'connecting') {
          instance.status = 'connecting'
          await instance.save()
        }
      } else {
        console.log(`⚠️  Evolution instance not found: ${instance.instanceName}`)
      }
    } catch (error) {
      console.error('❌ Error syncing Evolution API status:', error)
    }

    return response.ok({
      success: true,
      data: {
        connected: instance.status === 'connected',
        instance: {
          id: instance.id,
          instanceName: instance.instanceName,
          phoneNumber: instance.phoneNumber,
          status: instance.status,
          connectedAt: instance.connectedAt,
        },
      },
    })
  }

  /**
   * POST /api/whatsapp/connect
   * Cria instância WhatsApp (QR Code virá via webhook)
   */
  async connect({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)
    const data = await connectWhatsappValidator.validate(request.all())

    try {
      // 1. VERIFICAR SE JÁ TEM INSTÂNCIA CONECTADA
      const connectedInstance = await WhatsappInstance.query()
        .where('tenant_id', tenant.id)
        .where('status', 'connected')
        .first()

      if (connectedInstance) {
        return response.badRequest({
          success: false,
          error: {
            code: 'ALREADY_CONNECTED',
            message: 'WhatsApp already connected. Disconnect first.',
          },
        })
      }

      // 2. DELETAR SOMENTE AS INSTÂNCIAS DO TENANT ATUAL (banco + Evolution API)
      // IMPORTANTE: NÃO deletar instâncias de outros tenants da Evolution API
      console.log('🧹 Cleaning old instances for this tenant only...')

      const dbInstances = await WhatsappInstance.query().where('tenant_id', tenant.id)

      for (const dbInstance of dbInstances) {
        try {
          console.log(`  Deleting ${dbInstance.instanceName} from Evolution API...`)
          await evolutionApiService.deleteInstance(dbInstance.instanceName)
        } catch (error) {
          console.log(`  Failed to delete ${dbInstance.instanceName} from Evolution API (may not exist)`)
        }
        await dbInstance.delete()
      }

      console.log('✅ All old instances deleted')

      // 3. CRIAR NOVA INSTÂNCIA NO BANCO
      const instance = await WhatsappInstance.create({
        tenantId: tenant.id,
        instanceName: data.instanceName,
        status: 'connecting',
      })

      // 4. CRIAR NA EVOLUTION API
      const webhookUrl = `${env.get('APP_URL')}/api/webhooks/whatsapp`

      console.log(`📱 Creating instance ${instance.instanceName} in Evolution API...`)

      await evolutionApiService.createInstance(instance.instanceName, {
        qrcode: true,
        webhookUrl,
        webhookByEvents: false,
        webhookEvents: ['CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        // Configurações de privacidade e segurança
        readMessages: false, // Não marcar mensagens como lidas
        readStatus: false, // Não marcar status como visto
        syncFullHistory: false, // Não sincronizar histórico
        groupsIgnore: true, // Ignorar mensagens de grupos
        rejectCall: false, // Não rejeitar chamadas (usuário decide)
        alwaysOnline: false, // Não aparecer sempre online
      })

      console.log('✅ Instance created successfully')
      console.log(`📡 Webhook URL: ${webhookUrl}`)
      console.log('⏳ QR Code will be sent via webhook QRCODE_UPDATED')

      return response.ok({
        success: true,
        data: {
          instanceName: instance.instanceName,
          status: 'connecting',
          message: 'Instance created. QR Code will be available shortly via polling.',
        },
      })
    } catch (error: any) {
      console.error('❌ Error connecting WhatsApp:', error)

      return response.badRequest({
        success: false,
        error: {
          code: 'WHATSAPP_CONNECTION_FAILED',
          message: 'Failed to create WhatsApp instance',
          details: error.response?.data || error.message,
        },
      })
    }
  }

  /**
   * GET /api/whatsapp/qrcode
   * Retorna QR Code atual (busca ativamente da Evolution API)
   */
  async qrcode({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const instance = await WhatsappInstance.query().where('tenant_id', tenant.id).firstOrFail()

    // Se já está conectado, retornar status
    if (instance.status === 'connected') {
      return response.ok({
        success: true,
        data: {
          message: 'Instance connected successfully',
          status: 'connected',
        },
      })
    }

    try {
      // 1. Buscar instância completa da Evolution API
      const evolutionInstance = await evolutionApiService.fetchInstance(instance.instanceName)

      if (!evolutionInstance) {
        return response.badRequest({
          success: false,
          error: {
            code: 'INSTANCE_NOT_FOUND',
            message: 'Instance not found in Evolution API',
          },
        })
      }

      // 2. Verificar se já conectou
      if (evolutionInstance.connectionStatus === 'open') {
        instance.status = 'connected'
        instance.connectedAt = DateTime.now()
        instance.phoneNumber = evolutionInstance.number || null
        instance.qrCode = null
        await instance.save()

        return response.ok({
          success: true,
          data: {
            message: 'Instance connected successfully',
            status: 'connected',
          },
        })
      }

      // 3. Se tem QR Code no banco, retornar
      if (instance.qrCode) {
        return response.ok({
          success: true,
          data: {
            qrCode: instance.qrCode,
            status: instance.status,
            expiresIn: 60,
          },
        })
      }

      // 4. QR Code ainda não disponível
      return response.ok({
        success: true,
        data: {
          qrCode: null,
          status: instance.status,
          message: 'QR code not generated yet. Please wait a few seconds.',
        },
      })
    } catch (error) {
      console.error('Error getting QR code:', error)

      return response.badRequest({
        success: false,
        error: {
          code: 'QRCODE_ERROR',
          message: 'Failed to get QR code',
        },
      })
    }
  }

  /**
   * POST /api/whatsapp/disconnect
   * Desconecta e deleta completamente a instância WhatsApp
   */
  async disconnect({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const instance = await WhatsappInstance.query().where('tenant_id', tenant.id).firstOrFail()

    try {
      console.log(`🗑️  Disconnecting and deleting instance: ${instance.instanceName}`)

      // 1. Fazer logout da instância primeiro
      try {
        await evolutionApiService.logout(instance.instanceName)
        console.log(`📴 Instance logged out from Evolution API`)

        // Aguardar um momento para a instância desconectar completamente
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error: any) {
        // Se já foi desconectada, ignorar erro
        if (error.response?.status !== 404) {
          console.log(`⚠️  Logout warning: ${error.message}`)
        }
      }

      // 2. Deletar da Evolution API
      try {
        await evolutionApiService.deleteInstance(instance.instanceName)
        console.log(`✅ Instance deleted from Evolution API`)
      } catch (error: any) {
        // Mostrar erro completo para debug
        console.error('⚠️  Delete instance error:', error.response?.data || error.message)

        // Se for 400 (instância precisa estar desconectada) ou 404 (já deletada), ignorar
        // O logout já foi feito com sucesso, então podemos continuar
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.log(`ℹ️  Continuing without delete (instance already logged out)`)
        } else {
          throw error
        }
      }

      // 3. Deletar do banco de dados
      await instance.delete()
      console.log(`✅ Instance deleted from database`)

      return response.ok({
        success: true,
        data: {
          message: 'WhatsApp disconnected successfully',
        },
      })
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp:', error)

      return response.badRequest({
        success: false,
        error: {
          code: 'DISCONNECT_FAILED',
          message: 'Failed to disconnect WhatsApp',
        },
      })
    }
  }

  /**
   * GET /api/whatsapp/health
   * Retorna métricas de saúde da instância WhatsApp
   */
  async health({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const instance = await WhatsappInstance.query().where('tenant_id', tenant.id).first()

    if (!instance) {
      return response.ok({
        success: true,
        data: {
          hasInstance: false,
          message: 'No WhatsApp instance configured',
        },
      })
    }

    // Buscar ou criar métricas
    const healthService = new WhatsappHealthService()
    const metrics = await healthService.calculateAndUpdateMetrics(instance.id)

    // Buscar configurações de rate limit
    let config = await RateLimitConfig.query().where('tenant_id', tenant.id).first()

    if (!config) {
      // Criar configuração padrão
      config = await RateLimitConfig.create({
        tenantId: tenant.id,
        maxMessagesPerMinute: null,
        maxMessagesPerHour: null,
        maxMessagesPerDay: null,
        minDelayBetweenMessages: 3,
        warmupDailyIncrease: 10,
        warmupMaxDailyMessages: 50,
        allowedStartTime: '08:00:00',
        allowedEndTime: '22:00:00',
        blockManualSends: true,
        requireTemplate: true,
        enablePersonalizationCheck: true,
        minResponseRate: 30,
        autoPauseOnLowQuality: true,
        maxIdenticalMessages: 3,
        maxFailuresBeforePause: 10,
      })
    }

    // Verificar se precisa atualizar tier
    await healthService.updateTierIfNeeded(metrics)

    return response.ok({
      success: true,
      data: {
        health: {
          score: metrics.healthScore,
          qualityRating: metrics.qualityRating,
          isHealthy: metrics.isHealthy(),
          isWarmingUp: metrics.isWarmingUp,
          daysSinceConnection: metrics.daysSinceConnection,
        },
        tier: {
          current: metrics.currentTier,
          dailyLimit: metrics.dailyLimit,
          usageToday: metrics.messagesSentLast24h,
          usagePercent: Math.round((metrics.messagesSentLast24h / metrics.dailyLimit) * 100),
          nearLimit: metrics.isNearDailyLimit(),
        },
        metrics: {
          lastMinute: metrics.messagesSentLastMinute,
          lastHour: metrics.messagesSentLastHour,
          last24h: metrics.messagesSentLast24h,
          last7days: metrics.messagesSentLast7days,
        },
        quality: {
          deliveryRate: metrics.getDeliveryRate(),
          responseRate: metrics.getResponseRate(),
          failureRate: metrics.getFailureRate(),
          messagesDelivered: metrics.messagesDelivered,
          messagesRead: metrics.messagesRead,
          messagesFailed: metrics.messagesFailed,
          userResponses: metrics.userResponsesReceived,
          blocksReported: metrics.userBlocksReported,
        },
        alerts: metrics.alerts || [],
        config: {
          minDelayBetweenMessages: config.minDelayBetweenMessages,
          allowedHours: `${config.allowedStartTime} - ${config.allowedEndTime}`,
          warmupMaxDailyMessages: config.warmupMaxDailyMessages,
          minResponseRate: config.minResponseRate,
        },
        lastUpdate: metrics.metricsCalculatedAt,
      },
    })
  }

  /**
   * POST /api/whatsapp/webhook
   * Webhook da Evolution API para updates de status
   * Recebe eventos: CONNECTION_UPDATE, QRCODE_UPDATED
   */
  async webhook({ request, response }: HttpContext) {
    const payload = request.body()

    console.log('🔔 Evolution API Webhook Received:')
    console.log(JSON.stringify(payload, null, 2))

    try {
      const { instance: instanceName, event, data } = payload

      if (!instanceName) {
        return response.badRequest({
          success: false,
          error: { code: 'MISSING_INSTANCE', message: 'Instance name is required' },
        })
      }

      // Buscar instância no banco
      const instance = await WhatsappInstance.query()
        .where('instance_name', instanceName)
        .first()

      if (!instance) {
        return response.notFound({
          success: false,
          error: { code: 'INSTANCE_NOT_FOUND', message: 'Instance not found' },
        })
      }

      // Processar evento CONNECTION_UPDATE
      if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
        const state = data.state || data.connection

        if (state === 'open') {
          const phoneNumber = data.phoneNumber || data.instance?.number || null

          // Verificar se o número já está conectado em outro tenant
          if (phoneNumber) {
            const existingConnection = await WhatsappInstance.query()
              .where('phone_number', phoneNumber)
              .where('status', 'connected')
              .whereNot('id', instance.id)
              .first()

            if (existingConnection) {
              console.error(`🚫 Phone ${phoneNumber} already connected on tenant ${existingConnection.tenantId}. Refusing connection for instance ${instanceName} (tenant ${instance.tenantId}).`)
              // Desconectar automaticamente para proteger o tenant original
              try {
                const { default: evolutionApi } = await import('#services/evolution_api_service')
                await evolutionApi.logout(instanceName)
              } catch (e: any) {
                console.error('Could not auto-logout duplicate instance:', e.message)
              }
              return response.ok({ success: true })
            }
          }

          instance.status = 'connected'
          instance.phoneNumber = phoneNumber
          instance.connectedAt = DateTime.now()
          instance.qrCode = null
          await instance.save()

          console.log(`✅ Instance ${instanceName} connected!`)
        } else if (state === 'close') {
          instance.status = 'disconnected'
          instance.phoneNumber = null
          instance.connectedAt = null
          await instance.save()

          console.log(`❌ Instance ${instanceName} disconnected`)
        } else if (state === 'connecting') {
          instance.status = 'connecting'
          // Limpar QR Code quando entrar em modo de sincronização (após escaneamento)
          // Isso permite que o frontend mostre a tela de "Sincronizando"
          instance.qrCode = null
          await instance.save()

          console.log(`🔄 Instance ${instanceName} synchronizing...`)
        }
      }

      // Processar evento QRCODE_UPDATED
      if (event === 'QRCODE_UPDATED' || event === 'qrcode.updated') {
        const qrCode = data.qrcode?.base64 || data.base64

        if (qrCode) {
          instance.qrCode = qrCode
          instance.status = 'connecting'
          await instance.save()

          console.log(`🔄 QR Code updated for instance ${instanceName}`)
        }
      }

      return response.ok({ success: true })
    } catch (error) {
      console.error('Error processing webhook:', error)

      return response.badRequest({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Error processing webhook',
        },
      })
    }
  }
}
