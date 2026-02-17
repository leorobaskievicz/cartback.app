import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { DateTime } from 'luxon'

// Controllers
const AuthController = () => import('#controllers/auth_controller')
const TenantsController = () => import('#controllers/tenants_controller')
const StoreIntegrationsController = () => import('#controllers/store_integrations_controller')
const WhatsappController = () => import('#controllers/whatsapp_controller')
const MessageTemplatesController = () => import('#controllers/message_templates_controller')
const AbandonedCartsController = () => import('#controllers/abandoned_carts_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const PlansController = () => import('#controllers/plans_controller')
const NuvemshopWebhookController = () => import('#controllers/webhooks/nuvemshop_webhook_controller')
const NuvemshopScriptWebhookController = () => import('#controllers/webhooks/nuvemshop_script_webhook_controller')
const AsaasWebhookController = () => import('#controllers/webhooks/asaas_webhook_controller')
const CustomWebhookController = () => import('#controllers/webhooks/custom_webhook_controller')
const WhatsappSendWebhookController = () => import('#controllers/webhooks/whatsapp_send_webhook_controller')

// Health check
router.get('/', async () => {
  return {
    message: 'CartBack API is running',
    version: '1.0.0',
    timestamp: DateTime.now().toISO()
  }
})

router.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: DateTime.now().toISO()
  }
})

// Serve Nuvemshop script
router.get('/nuvemshop-cart-tracker.js', async ({ response }: any) => {
  return response.download('public/nuvemshop-cart-tracker.js', {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=3600',
  })
})

// Test endpoint
router.get('/api/test/controller', async ({ response }: any) => {
  console.log('🧪 Test endpoint called')
  const PlansController = (await import('#controllers/plans_controller')).default
  console.log('🧪 PlansController imported:', !!PlansController)
  return response.ok({ success: true, message: 'Test OK' })
})

// Rotas públicas - Autenticação
router.post('/api/auth/register', [AuthController, 'register'])
router.post('/api/auth/login', [AuthController, 'login'])

// Planos (público)
router.get('/api/plans', [PlansController, 'index'])

// Webhooks públicos (sem auth, mas validados internamente)
router
  .group(() => {
    router.post('/nuvemshop/:tenantUuid', [NuvemshopWebhookController, 'abandonedCart'])
    router.post('/nuvemshop/:tenantUuid/order', [NuvemshopWebhookController, 'orderCreated'])
    router.post('/nuvemshop-script/:tenantUuid', [NuvemshopScriptWebhookController, 'handle'])
    router.post('/custom/:tenantUuid', [CustomWebhookController, 'receive'])
    router.post('/custom/:tenantUuid/order', [CustomWebhookController, 'orderCreated'])
    router.post('/custom/:tenantUuid/whatsapp/send', [WhatsappSendWebhookController, 'send'])
    router.get('/custom/docs', [CustomWebhookController, 'docs'])
    router.post('/whatsapp', [WhatsappController, 'webhook'])
    router.post('/asaas', [AsaasWebhookController, 'handle'])
  })
  .prefix('/api/webhooks')

// OAuth Callbacks (sem auth)
router.get('/api/integrations/nuvemshop/callback', [StoreIntegrationsController, 'nuvemshopCallback'])

// Rotas autenticadas
router
  .group(() => {
    // Auth - /api/auth
    router
      .group(() => {
        router.post('/logout', [AuthController, 'logout'])
        router.get('/me', [AuthController, 'me'])
        router.post('/change-password', [AuthController, 'changePassword'])
      })
      .prefix('/auth')

    // Tenant - /api/tenant
    router.get('/tenant', [TenantsController, 'show'])
    router.put('/tenant', [TenantsController, 'update'])

    // Store Integrations - /api/integrations
    router
      .group(() => {
        router.get('/', [StoreIntegrationsController, 'index'])
        router.post('/nuvemshop/connect', [StoreIntegrationsController, 'connectNuvemshop'])
        router.post('/custom/create', [StoreIntegrationsController, 'createCustomWebhook'])
        router.get('/custom/:id', [StoreIntegrationsController, 'getCustomWebhook'])
        router.post('/custom/:id/regenerate-key', [StoreIntegrationsController, 'regenerateCustomWebhookKey'])
        router.delete('/:id', [StoreIntegrationsController, 'destroy'])
      })
      .prefix('/integrations')

    // WhatsApp - /api/whatsapp
    router
      .group(() => {
        router.get('/', [WhatsappController, 'index'])
        router.post('/connect', [WhatsappController, 'connect'])
        router.get('/qrcode', [WhatsappController, 'qrcode'])
        router.post('/disconnect', [WhatsappController, 'disconnect'])
        router.get('/health', [WhatsappController, 'health'])
      })
      .prefix('/whatsapp')

    // Message Templates - /api/templates
    router
      .group(() => {
        router.get('/', [MessageTemplatesController, 'index'])
        router.post('/', [MessageTemplatesController, 'store'])
        router.put('/reorder', [MessageTemplatesController, 'reorder'])
        router.post('/:id/test', [MessageTemplatesController, 'test'])
        router.put('/:id', [MessageTemplatesController, 'update'])
        router.delete('/:id', [MessageTemplatesController, 'destroy'])
      })
      .prefix('/templates')

    // Abandoned Carts - /api/carts
    router
      .group(() => {
        router.get('/', [AbandonedCartsController, 'index'])
        router.get('/:id', [AbandonedCartsController, 'show'])
        router.put('/:id/cancel', [AbandonedCartsController, 'cancel'])
      })
      .prefix('/carts')

    // Dashboard - /api/dashboard
    router
      .group(() => {
        router.get('/stats', [DashboardController, 'stats'])
        router.get('/chart', [DashboardController, 'chart'])
      })
      .prefix('/dashboard')

    // Subscription - /api/subscription
    router
      .group(() => {
        router.get('/', [PlansController, 'show'])
        router.get('/usage', [PlansController, 'usage'])
        router.post('/checkout', [PlansController, 'checkout'])
        router.post('/change', [PlansController, 'change'])
        router.post('/cancel', [PlansController, 'cancel'])
        router.get('/payments', [PlansController, 'payments'])
      })
      .prefix('/subscription')
  })
  .prefix('/api')
  .use([middleware.auth(), middleware.tenant()])
