import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class CheckPhoneLogs extends BaseCommand {
  static commandName = 'check:phone-logs'
  static description = 'Verifica logs de um número específico'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const PHONE = '5541999261087'

    this.logger.info(`\n🔍 Buscando logs para o número ${PHONE}...\n`)

    try {
      // 1. Verificar carrinhos abandonados
      this.logger.info('=== CARRINHOS ABANDONADOS ===')
      const carts = await db.rawQuery(`
        SELECT id, tenant_id, customer_phone, customer_name, status,
               created_at, expires_at, cart_url, total_value
        FROM abandoned_carts
        WHERE customer_phone LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [`%${PHONE}%`])

      const cartsList = carts[0]

      if (cartsList.length === 0) {
        this.logger.warning('❌ Nenhum carrinho encontrado para esse número')
      } else {
        this.logger.info(`✅ Encontrados ${cartsList.length} carrinho(s):\n`)
        for (const cart of cartsList) {
          this.logger.info(`  ID: ${cart.id}`)
          this.logger.info(`  Tenant: ${cart.tenant_id}`)
          this.logger.info(`  Status: ${cart.status}`)
          this.logger.info(`  Telefone: ${cart.customer_phone}`)
          this.logger.info(`  Nome: ${cart.customer_name}`)
          this.logger.info(`  Total: ${cart.total_value}`)
          this.logger.info(`  URL: ${cart.cart_url}`)
          this.logger.info(`  Criado em: ${cart.created_at}`)
          this.logger.info(`  Expira em: ${cart.expires_at}`)
          this.logger.info('  ---')
        }
      }

      // 2. Verificar logs oficiais
      this.logger.info('\n=== WHATSAPP OFFICIAL LOGS ===')
      const officialLogs = await db.rawQuery(`
        SELECT id, tenant_id, template_name, recipient_phone, status,
               message_type, meta_message_id, error_message, error_code,
               body_params, created_at, sent_at, delivered_at, abandoned_cart_id
        FROM whatsapp_official_logs
        WHERE recipient_phone LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
      `, [`%${PHONE}%`])

      const officialLogsList = officialLogs[0]

      if (officialLogsList.length === 0) {
        this.logger.warning('❌ Nenhum log oficial encontrado')
      } else {
        this.logger.info(`✅ Encontrados ${officialLogsList.length} log(s) oficial(is):\n`)
        for (const log of officialLogsList) {
          this.logger.info(`  ID: ${log.id}`)
          this.logger.info(`  Tenant: ${log.tenant_id}`)
          this.logger.info(`  Cart ID: ${log.abandoned_cart_id}`)
          this.logger.info(`  Template: ${log.template_name}`)
          this.logger.info(`  Status: ${log.status}`)
          this.logger.info(`  Tipo: ${log.message_type}`)
          this.logger.info(`  Meta Message ID: ${log.meta_message_id || 'N/A'}`)
          this.logger.info(`  Error: ${log.error_message || 'N/A'}`)
          this.logger.info(`  Error Code: ${log.error_code || 'N/A'}`)
          this.logger.info(`  Body Params: ${log.body_params || 'N/A'}`)
          this.logger.info(`  Criado em: ${log.created_at}`)
          this.logger.info(`  Enviado em: ${log.sent_at || 'N/A'}`)
          this.logger.info(`  Entregue em: ${log.delivered_at || 'N/A'}`)
          this.logger.info('  ---')
        }
      }

      // 3. Verificar logs unificados
      this.logger.info('\n=== UNIFIED MESSAGE LOGS ===')
      const unifiedLogs = await db.rawQuery(`
        SELECT id, tenant_id, template_name, customer_phone, channel, status,
               message_type, external_message_id, error_message, error_code,
               metadata, created_at, sent_at, delivered_at
        FROM unified_message_logs
        WHERE customer_phone LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
      `, [`%${PHONE}%`])

      const unifiedLogsList = unifiedLogs[0]

      if (unifiedLogsList.length === 0) {
        this.logger.warning('❌ Nenhum log unificado encontrado')
      } else {
        this.logger.info(`✅ Encontrados ${unifiedLogsList.length} log(s) unificado(s):\n`)
        for (const log of unifiedLogsList) {
          this.logger.info(`  ID: ${log.id}`)
          this.logger.info(`  Tenant: ${log.tenant_id}`)
          this.logger.info(`  Template: ${log.template_name}`)
          this.logger.info(`  Channel: ${log.channel}`)
          this.logger.info(`  Status: ${log.status}`)
          this.logger.info(`  Message Type: ${log.message_type}`)
          this.logger.info(`  External ID: ${log.external_message_id || 'N/A'}`)
          this.logger.info(`  Error: ${log.error_message || 'N/A'}`)
          this.logger.info(`  Error Code: ${log.error_code || 'N/A'}`)
          this.logger.info(`  Metadata: ${log.metadata || 'N/A'}`)
          this.logger.info(`  Criado em: ${log.created_at}`)
          this.logger.info(`  Enviado em: ${log.sent_at || 'N/A'}`)
          this.logger.info(`  Entregue em: ${log.delivered_at || 'N/A'}`)
          this.logger.info('  ---')
        }
      }

      // 4. Se houver carrinhos, verificar templates do tenant
      if (cartsList.length > 0) {
        const tenantId = cartsList[0].tenant_id
        this.logger.info(`\n=== TEMPLATES DO TENANT ${tenantId} ===`)
        const templates = await db.rawQuery(`
          SELECT id, name, is_active, meta_status, meta_template_name,
                 meta_template_id, delay_minutes, trigger_type
          FROM message_templates
          WHERE tenant_id = ?
          AND trigger_type = 'abandoned_cart'
          ORDER BY delay_minutes ASC
        `, [tenantId])

        const templatesList = templates[0]

        if (templatesList.length === 0) {
          this.logger.warning('❌ Nenhum template encontrado')
        } else {
          this.logger.info(`✅ Encontrados ${templatesList.length} template(s):\n`)
          for (const template of templatesList) {
            this.logger.info(`  ID: ${template.id}`)
            this.logger.info(`  Nome: ${template.name}`)
            this.logger.info(`  Ativo: ${template.is_active}`)
            this.logger.info(`  Meta Status: ${template.meta_status || 'N/A'}`)
            this.logger.info(`  Meta Template Name: ${template.meta_template_name || 'N/A'}`)
            this.logger.info(`  Meta Template ID: ${template.meta_template_id || 'N/A'}`)
            this.logger.info(`  Delay: ${template.delay_minutes} min`)
            this.logger.info('  ---')
          }
        }

        // 5. Verificar credenciais da API Oficial
        this.logger.info(`\n=== CREDENCIAIS API OFICIAL TENANT ${tenantId} ===`)
        const credentials = await db.rawQuery(`
          SELECT id, phone_number_id, waba_id, is_active, status,
                 token_expires_at, created_at
          FROM whatsapp_official_credentials
          WHERE tenant_id = ?
          ORDER BY created_at DESC
        `, [tenantId])

        const credentialsList = credentials[0]

        if (credentialsList.length === 0) {
          this.logger.warning('❌ Nenhuma credencial encontrada')
        } else {
          this.logger.info(`✅ Encontradas ${credentialsList.length} credencial(is):\n`)
          for (const cred of credentialsList) {
            this.logger.info(`  ID: ${cred.id}`)
            this.logger.info(`  Phone Number ID: ${cred.phone_number_id}`)
            this.logger.info(`  WABA ID: ${cred.waba_id}`)
            this.logger.info(`  Ativo: ${cred.is_active}`)
            this.logger.info(`  Status: ${cred.status}`)
            this.logger.info(`  Token Expira em: ${cred.token_expires_at || 'N/A'}`)
            this.logger.info(`  Criado em: ${cred.created_at}`)
            this.logger.info('  ---')
          }
        }
      }

      this.logger.info('\n✅ Análise completa!')
    } catch (error: any) {
      this.logger.error(`❌ Erro ao buscar logs: ${error.message}`)
      this.logger.error(error.stack)
    }
  }
}
