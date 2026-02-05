import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'abandoned_carts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.integer('store_integration_id').unsigned().notNullable().references('id').inTable('store_integrations').onDelete('CASCADE')
      table.string('external_cart_id').notNullable()
      table.string('external_customer_id').nullable()
      table.string('customer_name').nullable()
      table.string('customer_email').nullable()
      table.string('customer_phone').notNullable()
      table.string('cart_url').nullable()
      table.decimal('total_value', 10, 2).nullable()
      table.string('currency', 3).defaultTo('BRL')
      table.json('items').nullable()
      table.enum('status', ['pending', 'processing', 'recovered', 'expired', 'cancelled']).defaultTo('pending')
      table.timestamp('recovered_at').nullable()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index('external_cart_id')
      table.index('customer_phone')
      table.index('status')
      table.index(['tenant_id', 'status'])
      table.index(['store_integration_id', 'external_cart_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
