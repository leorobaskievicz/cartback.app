import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().references('tenants.id').onDelete('CASCADE').notNullable()
      table.integer('subscription_id').unsigned().references('subscriptions.id').onDelete('CASCADE').notNullable()
      table.string('external_payment_id').notNullable().index()
      table.integer('amount').notNullable() // centavos
      table.enum('status', ['pending', 'confirmed', 'received', 'overdue', 'refunded', 'cancelled']).defaultTo('pending')
      table.enum('payment_method', ['pix', 'credit_card', 'boleto']).notNullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('due_date').notNullable()
      table.string('invoice_url').nullable()
      table.text('pix_qr_code').nullable()
      table.text('pix_copy_paste').nullable()
      table.string('boleto_url').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
