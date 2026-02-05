import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().unique().references('id').inTable('tenants').onDelete('CASCADE')
      table.enum('plan', ['starter', 'pro', 'business']).notNullable()
      table.enum('status', ['active', 'past_due', 'cancelled']).defaultTo('active')
      table.enum('payment_gateway', ['asaas', 'stripe']).defaultTo('asaas')
      table.string('external_subscription_id').nullable()
      table.string('external_customer_id').nullable()
      table.timestamp('current_period_start').notNullable()
      table.timestamp('current_period_end').notNullable()
      table.integer('messages_limit').notNullable()
      table.integer('messages_used').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index(['tenant_id', 'status'])
      table.index('external_subscription_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
