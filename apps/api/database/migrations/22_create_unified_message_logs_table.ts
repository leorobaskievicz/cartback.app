import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration para criar tabela unificada de logs de mensagens
 *
 * Esta tabela registra TODOS os envios de mensagem da plataforma:
 * - Evolution API (WhatsApp Baileys)
 * - WhatsApp Official API (Meta)
 * - Envios individuais e em lote
 * - Sucessos e falhas
 *
 * Permite análise completa de todos os disparos e tentativas
 */
export default class extends BaseSchema {
  protected tableName = 'unified_message_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Identificação
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')

      // Tipo de envio
      table.enum('provider', ['evolution', 'official']).notNullable().comment('evolution = Evolution API, official = WhatsApp Official API')
      table.enum('message_type', ['text', 'template', 'image', 'document', 'video', 'audio']).notNullable().defaultTo('text')

      // Destinatário
      table.string('customer_phone', 20).notNullable().comment('Telefone do destinatário com código do país')
      table.string('customer_name', 255).nullable().comment('Nome do destinatário')

      // Contexto (opcional - nem todas mensagens são de carrinho abandonado)
      table.integer('abandoned_cart_id').unsigned().nullable().references('id').inTable('abandoned_carts').onDelete('SET NULL')

      // Template usado
      table.integer('message_template_id').unsigned().nullable().references('id').inTable('message_templates').onDelete('SET NULL')
      table.string('template_name', 255).nullable().comment('Nome do template no momento do envio')

      // Credenciais/Instância utilizada
      table.integer('whatsapp_instance_id').unsigned().nullable().references('id').inTable('whatsapp_instances').onDelete('SET NULL')
      table.integer('official_credential_id').unsigned().nullable().references('id').inTable('whatsapp_official_credentials').onDelete('SET NULL')

      // Conteúdo da mensagem
      table.text('message_content').nullable().comment('Conteúdo final enviado (texto ou JSON para templates)')
      table.json('template_variables').nullable().comment('Variáveis usadas no template (formato JSON)')

      // Status e rastreamento
      table.enum('status', ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled']).notNullable().defaultTo('queued')
      table.string('external_message_id', 255).nullable().comment('ID da mensagem retornado pela API')

      // Erro (se houver)
      table.text('error_message').nullable()
      table.string('error_code', 50).nullable()

      // Timestamps do ciclo de vida
      table.timestamp('queued_at').nullable().comment('Quando foi colocado na fila')
      table.timestamp('sent_at').nullable().comment('Quando foi efetivamente enviado')
      table.timestamp('delivered_at').nullable().comment('Quando foi entregue (confirmação)')
      table.timestamp('read_at').nullable().comment('Quando foi lido pelo destinatário')
      table.timestamp('failed_at').nullable().comment('Quando falhou')

      // Metadados adicionais
      table.json('metadata').nullable().comment('Dados extras (origem, campanha, etc)')

      // Timestamps padrão
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices para performance
      table.index('tenant_id')
      table.index('provider')
      table.index('status')
      table.index('customer_phone')
      table.index('abandoned_cart_id')
      table.index('message_template_id')
      table.index(['tenant_id', 'status'])
      table.index(['tenant_id', 'provider'])
      table.index(['tenant_id', 'created_at'])
      table.index('external_message_id')
      table.index('created_at') // Para queries de relatório por período
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
