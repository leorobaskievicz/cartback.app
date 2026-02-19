import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_official_credentials'

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
      table.string('phone_number_id').notNullable().comment('ID do número de telefone na Meta')
      table.string('waba_id').notNullable().comment('WhatsApp Business Account ID')
      table.text('access_token').notNullable().comment('Token de acesso permanente da Meta')
      table.string('webhook_verify_token').notNullable().comment('Token para verificação do webhook Meta')
      table.string('phone_number').nullable().comment('Número de telefone formatado (+55...)')
      table.string('display_name').nullable().comment('Nome de exibição do número')
      table.enum('status', ['active', 'inactive', 'error']).defaultTo('active')
      table.text('last_error').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('tenant_id')
      table.unique('tenant_id') // Um conjunto de credenciais por tenant
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
