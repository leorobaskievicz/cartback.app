import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_official_templates'

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
      table.string('meta_template_id').nullable().comment('ID do template na Meta (após aprovação)')
      table.string('name').notNullable().comment('Nome do template (lowercase, sem espaços)')
      table.string('display_name').nullable().comment('Nome amigável para exibição')
      table
        .enum('category', ['MARKETING', 'UTILITY', 'AUTHENTICATION'])
        .notNullable()
        .defaultTo('UTILITY')
      table.string('language').notNullable().defaultTo('pt_BR')
      table
        .enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'])
        .defaultTo('PENDING')
      table.text('rejection_reason').nullable()

      // Estrutura do template (armazenada como JSON)
      table.text('components').notNullable().comment('JSON com os componentes do template (header, body, footer, buttons)')

      // Campos extraídos para facilitar consultas
      table.text('body_text').nullable().comment('Texto do body para preview')
      table.string('header_type').nullable().comment('TEXT | IMAGE | VIDEO | DOCUMENT')
      table.string('header_text').nullable()
      table.text('footer_text').nullable()
      table.integer('buttons_count').defaultTo(0)

      table.timestamp('approved_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('tenant_id')
      table.index(['tenant_id', 'status'])
      table.index('meta_template_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
