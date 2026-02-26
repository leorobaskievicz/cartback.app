import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('variable_mapping').nullable().after('meta_components')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('variable_mapping')
    })
  }
}
