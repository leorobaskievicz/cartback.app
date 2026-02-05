import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_instances'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.string('instance_name').notNullable().unique()
      table.string('instance_id').nullable()
      table.string('phone_number').nullable()
      table.enum('status', ['disconnected', 'connecting', 'connected']).defaultTo('disconnected')
      table.text('qr_code').nullable()
      table.timestamp('connected_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('tenant_id')
      table.index(['tenant_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
