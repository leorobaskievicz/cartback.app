import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_official_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('trigger_type', ['abandoned_cart', 'order_confirmation'])
        .notNullable()
        .defaultTo('abandoned_cart')
        .comment('Tipo de gatilho para disparo automático')
        .after('tenant_id')

      table
        .integer('delay_minutes')
        .notNullable()
        .defaultTo(0)
        .comment('Delay em minutos após o evento para envio')
        .after('trigger_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('trigger_type')
      table.dropColumn('delay_minutes')
    })
  }
}
