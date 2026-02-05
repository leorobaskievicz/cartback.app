import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_integrations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.enum('platform', ['nuvemshop', 'yampi', 'shopify', 'woocommerce', 'webhook']).notNullable()
      table.string('store_id').nullable()
      table.string('store_name').nullable()
      table.string('store_url').nullable()
      table.text('access_token').nullable()
      table.text('refresh_token').nullable()
      table.string('webhook_secret').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('connected_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index(['tenant_id', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
