import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_official_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table
        .integer('official_template_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('whatsapp_official_templates')
        .onDelete('SET NULL')
      table
        .integer('abandoned_cart_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('abandoned_carts')
        .onDelete('SET NULL')

      table.string('template_name').notNullable()
      table.string('recipient_phone').notNullable()
      table.string('recipient_name').nullable()
      table.string('language_code').defaultTo('pt_BR')

      table
        .enum('message_type', ['template', 'text', 'image', 'document'])
        .defaultTo('template')
      table
        .enum('status', ['queued', 'sent', 'delivered', 'read', 'failed'])
        .defaultTo('queued')

      table.string('meta_message_id').nullable().comment('ID da mensagem retornado pela Meta API')
      table.text('error_message').nullable()
      table.integer('error_code').nullable()

      // Parâmetros enviados no disparo
      table.text('body_params').nullable().comment('JSON com parâmetros do body')
      table.text('header_params').nullable().comment('JSON com parâmetros do header')
      table.text('button_params').nullable().comment('JSON com parâmetros dos botões')

      table.timestamp('sent_at').nullable()
      table.timestamp('delivered_at').nullable()
      table.timestamp('read_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('tenant_id')
      table.index(['tenant_id', 'status'])
      table.index('meta_message_id')
      table.index(['tenant_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
