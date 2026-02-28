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
const WhatsappBatchSendWebhookController = () => import('#controllers/webhooks/whatsapp_batch_send_webhook_controller')
const TemplateSendWebhookController = () => import('#controllers/webhooks/template_send_webhook_controller')
// WhatsApp Official API Controllers
const WhatsappOfficialCredentialsController = () => import('#controllers/whatsapp_official_credentials_controller')
const WhatsappOfficialTemplatesController = () => import('#controllers/whatsapp_official_templates_controller')
const WhatsappOfficialLogsController = () => import('#controllers/whatsapp_official_logs_controller')
const WhatsappOfficialWebhookController = () => import('#controllers/webhooks/whatsapp_official_webhook_controller')
// Admin Controllers
const AdminController = () => import('#controllers/admin_controller')
const AdminTenantsController = () => import('#controllers/admin_tenants_controller')
const AdminLogsController = () => import('#controllers/admin_logs_controller')
// Debug Controller
const WhatsappDebugController = () => import('#controllers/whatsapp_debug_controller')
const DebugBatchController = () => import('#controllers/debug_batch_controller')

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

// TEMPORÁRIO: Debug endpoint (SEM AUTH) - REMOVER APÓS DEBUG
router.get('/api/debug/last-batch', [DebugBatchController, 'lastBatch'])

// Webhooks públicos (sem auth, mas validados internamente)
router
  .group(() => {
    router.post('/nuvemshop/:tenantUuid', [NuvemshopWebhookController, 'abandonedCart'])
    router.post('/nuvemshop/:tenantUuid/order', [NuvemshopWebhookController, 'orderCreated'])
    router.post('/nuvemshop-script/:tenantUuid', [NuvemshopScriptWebhookController, 'handle'])
    router.post('/custom/:tenantUuid', [CustomWebhookController, 'receive'])
    router.post('/custom/:tenantUuid/order', [CustomWebhookController, 'orderCreated'])
    router.post('/custom/:tenantUuid/whatsapp/send', [WhatsappSendWebhookController, 'send'])
    router.post('/custom/:tenantUuid/whatsapp/batch-send', [WhatsappBatchSendWebhookController, 'send'])
    router.post('/custom/:tenantUuid/template/send', [TemplateSendWebhookController, 'send'])
    router.get('/custom/docs', [CustomWebhookController, 'docs'])
    router.post('/whatsapp', [WhatsappController, 'webhook'])
    router.get('/whatsapp-official/:tenantUuid', [WhatsappOfficialWebhookController, 'verify'])
    router.post('/whatsapp-official/:tenantUuid', [WhatsappOfficialWebhookController, 'handle'])
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

        // Debug endpoints
        router.post('/debug/format-phone', [WhatsappDebugController, 'formatPhone'])
        router.post('/debug/check-number', [WhatsappDebugController, 'checkNumber'])
        router.post('/debug/test-send', [WhatsappDebugController, 'testSend'])
      })
      .prefix('/whatsapp')

    // Message Templates - /api/templates
    router
      .group(() => {
        router.get('/', [MessageTemplatesController, 'index'])
        router.post('/', [MessageTemplatesController, 'store'])
        router.put('/reorder', [MessageTemplatesController, 'reorder'])
        router.post('/sync', [MessageTemplatesController, 'sync'])
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

    // WhatsApp Official API - /api/whatsapp-official
    router
      .group(() => {
        // Credenciais
        router.get('/credentials', [WhatsappOfficialCredentialsController, 'show'])
        router.post('/credentials', [WhatsappOfficialCredentialsController, 'upsert'])
        router.delete('/credentials', [WhatsappOfficialCredentialsController, 'destroy'])
        router.post('/credentials/verify', [WhatsappOfficialCredentialsController, 'verify'])

        // Templates
        router.get('/templates', [WhatsappOfficialTemplatesController, 'index'])
        router.get('/templates/:id', [WhatsappOfficialTemplatesController, 'show'])
        router.post('/templates', [WhatsappOfficialTemplatesController, 'store'])
        router.delete('/templates/:id', [WhatsappOfficialTemplatesController, 'destroy'])
        router.post('/templates/sync', [WhatsappOfficialTemplatesController, 'sync'])

        // Logs
        router.get('/logs', [WhatsappOfficialLogsController, 'index'])
        router.get('/logs/stats', [WhatsappOfficialLogsController, 'stats'])
        router.get('/logs/:id', [WhatsappOfficialLogsController, 'show'])
      })
      .prefix('/whatsapp-official')
  })
  .prefix('/api')
  .use([middleware.auth(), middleware.tenant()])

// Rotas de administração (requer autenticação + is_admin)
router
  .group(() => {
    // Dashboard geral
    router.get('/dashboard', [AdminController, 'dashboard'])
    router.get('/stats/overview', [AdminController, 'statsOverview'])

    // Gerenciamento de tenants
    router
      .group(() => {
        router.get('/', [AdminTenantsController, 'index'])
        router.get('/:id', [AdminTenantsController, 'show'])
        router.get('/:id/logs', [AdminTenantsController, 'logs'])
        router.get('/:id/templates', [AdminTenantsController, 'templates'])
        router.get('/:id/carts', [AdminTenantsController, 'carts'])
        router.patch('/:id/toggle-status', [AdminTenantsController, 'toggleStatus'])
      })
      .prefix('/tenants')

    // Logs unificados
    router
      .group(() => {
        router.get('/', [AdminLogsController, 'index'])
        router.get('/stats', [AdminLogsController, 'stats'])
        router.get('/analyze-last-batch', [AdminLogsController, 'analyzeLastBatch'])
        router.get('/analyze-failures', [AdminLogsController, 'analyzeFailures'])
        router.get('/:id', [AdminLogsController, 'show'])
      })
      .prefix('/logs')
  })
  .prefix('/api/admin')
  .use([middleware.auth(), middleware.admin()])
