import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_official_logs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop old foreign key constraint
      table.dropForeign('official_template_id')

      // Add new foreign key pointing to message_templates
      table
        .foreign('official_template_id')
        .references('id')
        .inTable('message_templates')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert to old foreign key
      table.dropForeign('official_template_id')

      table
        .foreign('official_template_id')
        .references('id')
        .inTable('whatsapp_official_templates')
        .onDelete('SET NULL')
    })
  }
}
