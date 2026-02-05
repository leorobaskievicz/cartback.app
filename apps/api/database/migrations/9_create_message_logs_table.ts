import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.integer('abandoned_cart_id').unsigned().notNullable().references('id').inTable('abandoned_carts').onDelete('CASCADE')
      table.integer('message_template_id').unsigned().notNullable().references('id').inTable('message_templates').onDelete('CASCADE')
      table.integer('whatsapp_instance_id').unsigned().notNullable().references('id').inTable('whatsapp_instances').onDelete('CASCADE')
      table.string('phone_number').notNullable()
      table.text('content').notNullable()
      table.enum('status', ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled']).defaultTo('queued')
      table.string('external_message_id').nullable()
      table.text('error_message').nullable()
      table.timestamp('sent_at').nullable()
      table.timestamp('delivered_at').nullable()
      table.timestamp('read_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index('abandoned_cart_id')
      table.index('status')
      table.index(['tenant_id', 'status'])
      table.index('external_message_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
