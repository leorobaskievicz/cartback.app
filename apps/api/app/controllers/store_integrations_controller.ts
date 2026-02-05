import type { HttpContext } from '@adonisjs/core/http'
import StoreIntegration from '#models/store_integration'
import Tenant from '#models/tenant'
import nuvemshopService from '#services/nuvemshop_service'
import customWebhookService from '#services/custom_webhook_service'
import { randomUUID } from 'crypto'
import env from '#start/env'
import { DateTime } from 'luxon'

export default class StoreIntegrationsController {
  /**
   * GET /api/integrations
   * Lista todas as integrações do tenant
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const integrations = await StoreIntegration.query().where('tenant_id', tenant.id)

    return response.ok({
      success: true,
      data: integrations.map((integration) => ({
        id: integration.id,
        platform: integration.platform,
        storeName: integration.storeName,
        storeUrl: integration.storeUrl,
        isActive: integration.isActive,
        connectedAt: integration.connectedAt,
      })),
    })
  }

  /**
   * POST /api/integrations/nuvemshop/connect
   * Inicia fluxo OAuth da Nuvemshop
   */
  async connectNuvemshop({ auth, response }: HttpContext) {
    const user = auth.user!
    const platform = 'nuvemshop'

    if (!user.tenantId) {
      return response.badRequest({
        success: false,
        error: { code: 'NO_TENANT', message: 'User has no tenant' },
      })
    }

    // State com tenant ID + UUID para segurança
    const state = `${user.tenantId}:${randomUUID()}`

    // Gerar URL de autorização
    const authUrl = nuvemshopService.getAuthUrl(state)

    return response.ok({
      success: true,
      data: { authUrl, platform },
    })
  }

  /**
   * GET /api/integrations/nuvemshop/callback
   * Callback OAuth da Nuvemshop (sem autenticação)
   */
  async nuvemshopCallback({ request, response }: HttpContext) {
    const { code, state } = request.qs()

    if (!code || !state) {
      console.error('[Nuvemshop Callback] Código ou state ausente')
      const webUrl = env.get('WEB_URL', 'http://localhost:5173')
      return response.redirect(`${webUrl}/integrations?error=missing_params`)
    }

    try {
      // Extrair tenantId do state
      const [tenantIdStr] = state.split(':')
      const tenantId = parseInt(tenantIdStr)

      if (!tenantId || isNaN(tenantId)) {
        throw new Error('Invalid tenant ID in state')
      }

      // Buscar tenant
      const tenant = await Tenant.find(tenantId)
      if (!tenant) {
        throw new Error('Tenant not found')
      }

      // Trocar código por token
      console.log('[Nuvemshop Callback] Trocando código por token...')
      const tokens = await nuvemshopService.exchangeCode(code)

      console.log(`[Nuvemshop Callback] Token recebido para store ID: ${tokens.user_id}`)

      // Buscar informações da loja
      const storeInfo = await nuvemshopService.getStoreInfo(tokens.user_id, tokens.access_token)

      console.log(`[Nuvemshop Callback] Loja: ${storeInfo.name}`)

      // Criar ou atualizar integração
      const integration = await StoreIntegration.updateOrCreate(
        {
          tenantId: tenant.id,
          platform: 'nuvemshop',
        },
        {
          storeId: String(tokens.user_id),
          storeName: storeInfo.name,
          storeUrl: storeInfo.url_with_protocol,
          accessToken: tokens.access_token, // TODO: Encriptar em produção
          isActive: true,
          connectedAt: DateTime.now(),
        }
      )

      console.log(`[Nuvemshop Callback] Integração salva (ID: ${integration.id})`)

      // Configurar webhooks
      const appUrl = env.get('APP_URL', 'http://localhost:3333')
      const webhookCartUrl = `${appUrl}/api/webhooks/nuvemshop/${tenant.uuid}`
      const webhookOrderUrl = `${appUrl}/api/webhooks/nuvemshop/${tenant.uuid}/order`

      console.log('[Nuvemshop Callback] Configurando webhooks...')

      await nuvemshopService.createAbandonedCartWebhook(
        tokens.user_id,
        tokens.access_token,
        webhookCartUrl
      )

      await nuvemshopService.createOrderWebhook(
        tokens.user_id,
        tokens.access_token,
        webhookOrderUrl
      )

      console.log('[Nuvemshop Callback] Webhooks configurados com sucesso!')

      // Redirecionar para frontend com sucesso
      const webUrl = env.get('WEB_URL', 'http://localhost:5173')
      return response.redirect(`${webUrl}/integrations?connected=nuvemshop`)
    } catch (error: any) {
      console.error('[Nuvemshop Callback] Erro:', error.response?.data || error.message)

      const webUrl = env.get('WEB_URL', 'http://localhost:5173')
      return response.redirect(`${webUrl}/integrations?error=nuvemshop`)
    }
  }

  /**
   * DELETE /api/integrations/:id
   * Desconecta integração
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const integration = await StoreIntegration.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    // Remover webhooks da plataforma
    if (integration.platform === 'nuvemshop' && integration.accessToken && integration.storeId) {
      try {
        const webhooks = await nuvemshopService.listWebhooks(
          parseInt(integration.storeId),
          integration.accessToken
        )

        const appUrl = env.get('APP_URL', 'http://localhost:3333')

        for (const webhook of webhooks) {
          // Remover apenas webhooks do CartBack
          if (webhook.url.includes(appUrl)) {
            await nuvemshopService.deleteWebhook(
              parseInt(integration.storeId),
              integration.accessToken,
              webhook.id
            )
            console.log(`[Integration] Webhook ${webhook.id} removido`)
          }
        }
      } catch (error: any) {
        console.error('[Integration] Erro ao remover webhooks:', error.message)
        // Continua mesmo se falhar (token pode estar expirado)
      }
    }

    // Marcar como inativa (soft delete)
    integration.isActive = false
    await integration.save()

    return response.ok({
      success: true,
      data: { message: 'Integration disconnected successfully' },
    })
  }

  /**
   * POST /api/integrations/custom/create
   * Cria uma integração webhook personalizada
   */
  async createCustomWebhook({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const { name, platformUrl } = request.only(['name', 'platformUrl'])

    if (!name) {
      return response.badRequest({
        success: false,
        error: { code: 'MISSING_NAME', message: 'Integration name is required' },
      })
    }

    // Verificar se já existe integração webhook ativa
    const existingIntegration = await StoreIntegration.query()
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .where('is_active', true)
      .first()

    if (existingIntegration) {
      return response.badRequest({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Custom webhook integration already exists' },
      })
    }

    // Gerar API Key única
    const apiKey = customWebhookService.generateApiKey()

    // Criar integração
    const integration = await StoreIntegration.create({
      tenantId: tenant.id,
      platform: 'webhook',
      storeName: name,
      storeUrl: platformUrl || null,
      webhookSecret: apiKey,
      isActive: true,
      connectedAt: DateTime.now(),
    })

    // Gerar URL do webhook
    const appUrl = env.get('APP_URL', 'http://localhost:3333')
    const webhookUrl = `${appUrl}/api/webhooks/custom/${tenant.uuid}`

    console.log(`[Integration] Webhook personalizado criado (ID: ${integration.id}, Tenant: ${tenant.id})`)

    return response.ok({
      success: true,
      data: {
        integration: {
          id: integration.id,
          name: integration.storeName,
          platform: 'webhook',
          webhookUrl,
          apiKey,
          createdAt: integration.createdAt,
        },
        message: 'Save this API Key securely. It will not be shown again.',
      },
    })
  }

  /**
   * GET /api/integrations/custom/:id
   * Retorna detalhes da integração webhook (sem API key)
   */
  async getCustomWebhook({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const integration = await StoreIntegration.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .firstOrFail()

    const appUrl = env.get('APP_URL', 'http://localhost:3333')
    const webhookUrl = `${appUrl}/api/webhooks/custom/${tenant.uuid}`

    return response.ok({
      success: true,
      data: {
        id: integration.id,
        name: integration.storeName,
        platform: 'webhook',
        platformUrl: integration.storeUrl,
        webhookUrl,
        isActive: integration.isActive,
        connectedAt: integration.connectedAt,
        createdAt: integration.createdAt,
      },
    })
  }

  /**
   * POST /api/integrations/custom/:id/regenerate-key
   * Regenera API Key da integração webhook
   */
  async regenerateCustomWebhookKey({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    const integration = await StoreIntegration.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .where('platform', 'webhook')
      .firstOrFail()

    // Gerar nova API Key
    const newApiKey = customWebhookService.generateApiKey()

    integration.webhookSecret = newApiKey
    await integration.save()

    console.log(`[Integration] API Key regenerada para integração ${integration.id}`)

    return response.ok({
      success: true,
      data: {
        apiKey: newApiKey,
        message: 'API Key regenerated successfully. Update your webhook configuration.',
      },
    })
  }
}
