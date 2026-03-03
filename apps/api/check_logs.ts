import { BaseCommand } from '@adonisjs/core/ace'
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import AbandonedCart from '#models/abandoned_cart'
import MessageTemplate from '#models/message_template'
import UnifiedMessageLog from '#models/unified_message_log'

const PHONE = '5541999261087'

console.log(`\n🔍 Buscando logs para o número ${PHONE}...\n`)

// 1. Verificar carrinhos abandonados para esse número
console.log('=== CARRINHOS ABANDONADOS ===')
const carts = await AbandonedCart.query()
  .where('customer_phone', 'like', `%${PHONE}%`)
  .orderBy('created_at', 'desc')
  .limit(10)

if (carts.length === 0) {
  console.log('❌ Nenhum carrinho encontrado para esse número')
} else {
  console.log(`✅ Encontrados ${carts.length} carrinho(s):\n`)
  for (const cart of carts) {
    console.log(`  ID: ${cart.id}`)
    console.log(`  Tenant: ${cart.tenantId}`)
    console.log(`  Status: ${cart.status}`)
    console.log(`  Telefone: ${cart.customerPhone}`)
    console.log(`  Nome: ${cart.customerName}`)
    console.log(`  Criado em: ${cart.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log(`  Expires at: ${cart.expiresAt?.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log('  ---')
  }
}

// 2. Verificar logs oficiais
console.log('\n=== WHATSAPP OFFICIAL LOGS ===')
const officialLogs = await WhatsappOfficialLog.query()
  .where('recipient_phone', 'like', `%${PHONE}%`)
  .orderBy('created_at', 'desc')
  .limit(20)

if (officialLogs.length === 0) {
  console.log('❌ Nenhum log oficial encontrado')
} else {
  console.log(`✅ Encontrados ${officialLogs.length} log(s) oficial(is):\n`)
  for (const log of officialLogs) {
    console.log(`  ID: ${log.id}`)
    console.log(`  Tenant: ${log.tenantId}`)
    console.log(`  Template: ${log.templateName}`)
    console.log(`  Status: ${log.status}`)
    console.log(`  Tipo: ${log.messageType}`)
    console.log(`  Meta Message ID: ${log.metaMessageId || 'N/A'}`)
    console.log(`  Error: ${log.errorMessage || 'N/A'}`)
    console.log(`  Body Params: ${log.bodyParams ? JSON.stringify(log.bodyParams) : 'N/A'}`)
    console.log(`  Criado em: ${log.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log(`  Enviado em: ${log.sentAt?.toFormat('dd/MM/yyyy HH:mm:ss') || 'N/A'}`)
    console.log(`  Delivered em: ${log.deliveredAt?.toFormat('dd/MM/yyyy HH:mm:ss') || 'N/A'}`)
    console.log('  ---')
  }
}

// 3. Verificar logs unificados
console.log('\n=== UNIFIED MESSAGE LOGS ===')
const unifiedLogs = await UnifiedMessageLog.query()
  .where('customer_phone', 'like', `%${PHONE}%`)
  .orderBy('created_at', 'desc')
  .limit(20)

if (unifiedLogs.length === 0) {
  console.log('❌ Nenhum log unificado encontrado')
} else {
  console.log(`✅ Encontrados ${unifiedLogs.length} log(s) unificado(s):\n`)
  for (const log of unifiedLogs) {
    console.log(`  ID: ${log.id}`)
    console.log(`  Tenant: ${log.tenantId}`)
    console.log(`  Template: ${log.templateName}`)
    console.log(`  Channel: ${log.channel}`)
    console.log(`  Status: ${log.status}`)
    console.log(`  Message Type: ${log.messageType}`)
    console.log(`  External ID: ${log.externalMessageId || 'N/A'}`)
    console.log(`  Error: ${log.errorMessage || 'N/A'}`)
    console.log(`  Metadata: ${JSON.stringify(log.metadata)}`)
    console.log(`  Criado em: ${log.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log('  ---')
  }
}

// 4. Se houver carrinhos, verificar templates do tenant
if (carts.length > 0) {
  const tenantId = carts[0].tenantId
  console.log(`\n=== TEMPLATES DO TENANT ${tenantId} ===`)
  const templates = await MessageTemplate.query()
    .where('tenant_id', tenantId)
    .where('trigger_type', 'abandoned_cart')
    .orderBy('delay_minutes', 'asc')

  if (templates.length === 0) {
    console.log('❌ Nenhum template encontrado')
  } else {
    console.log(`✅ Encontrados ${templates.length} template(s):\n`)
    for (const template of templates) {
      console.log(`  ID: ${template.id}`)
      console.log(`  Nome: ${template.name}`)
      console.log(`  Ativo: ${template.isActive}`)
      console.log(`  Meta Status: ${template.metaStatus || 'N/A'}`)
      console.log(`  Meta Template Name: ${template.metaTemplateName || 'N/A'}`)
      console.log(`  Meta Template ID: ${template.metaTemplateId || 'N/A'}`)
      console.log(`  Delay: ${template.delayMinutes} min`)
      console.log('  ---')
    }
  }
}

console.log('\n✅ Análise completa!\n')
process.exit(0)
