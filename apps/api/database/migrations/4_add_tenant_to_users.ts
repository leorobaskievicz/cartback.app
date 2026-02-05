import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.enum('role', ['owner', 'admin', 'viewer']).defaultTo('owner')

      // Índice para queries filtradas por tenant
      table.index('tenant_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tenant_id')
      table.dropColumn('role')
    })
  }
}
