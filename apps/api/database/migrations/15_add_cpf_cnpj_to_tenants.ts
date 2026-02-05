import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cpf_cnpj').nullable().after('phone')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cpf_cnpj')
    })
  }
}
