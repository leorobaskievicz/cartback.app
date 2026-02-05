import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.string('name').notNullable()
      table.enum('trigger_type', ['abandoned_cart', 'tracking_update']).defaultTo('abandoned_cart')
      table.integer('delay_minutes').notNullable().defaultTo(0)
      table.text('content').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index(['tenant_id', 'trigger_type', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
